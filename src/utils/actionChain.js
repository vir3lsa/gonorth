import {
  changeInteraction,
  chainStarted,
  chainEnded
} from "../redux/gameActions";
import { Interaction, Append } from "../game/interactions/interaction";
import { getStore } from "../redux/storeRegistry";
import { Text, SequentialText } from "../game/interactions/text";
import { OptionGraph } from "../game/interactions/optionGraph";

/*
 * Class representing a chainable action. Additional config can be set for the action.
 */
export class Action {
  constructor(action, renderNextButton) {
    this.action = action;
    this.renderNextButton = renderNextButton;
  }

  get action() {
    return this._action;
  }

  set action(action) {
    let actionFunction = action;

    if (typeof actionFunction !== "function") {
      actionFunction = () => action;
    }

    this._action = actionFunction;
  }
}

/*
 * Class representing a chain of actions. Actions can be in a variety of formats including strings, Texts, ActionChains, OptionGraphs
 * and arrays and functions that resolve to any of these. Any text produced by actions will be presented to the player and a 'Next'
 * button will usually be required to progress to the next action.
 */
export class ActionChain {
  constructor(...actions) {
    this.actions = actions;
    this.renderNexts = true;
    this.renderOptions = false;
    this.postScript = null;
    this.failed = false;
    this.helpers = {
      fail: () => (this.failed = true)
    };
  }

  set options(options) {
    this._options = options;
  }

  get options() {
    return this._options;
  }

  set postScript(postScript) {
    this._postScript = postScript;
  }

  get postScript() {
    return this._postScript;
  }

  addHelpers(helpers) {
    this.helpers = { ...this.helpers, ...helpers };
  }

  set actions(actions) {
    this._actions = actions.map((action, i, actions) => this.toChainableFunction(action, i, actions));
  }

  /* Insert an action at the beginning of the chain. */
  insertAction(action) {
    this._actions.unshift(this.toChainableFunction(action, 0, [action, ...this._actions]));
  }

  insertActions(...actions) {
    actions.reverse().forEach((action) => this.insertAction(action));
  }

  /* Add an action to the end of the chain. */
  addAction(action) {
    this._actions.push(this.toChainableFunction(action, this._actions.length, [...this._actions, action]));
  }

  dispatchAppend(text, options, nextIfNoOptions, clearPage) {
    const interactionType = clearPage ? Interaction : Append;

    return getStore().dispatch(
      changeInteraction(new interactionType(text, options, nextIfNoOptions, this.renderOptions))
    );
  }

  toChainableFunction(action, i, actions) {
    let actionFunction = action;
    const lastAction = i === actions.length - 1;

    if (typeof actionFunction !== "function") {
      actionFunction = () => action;
    }

    return (...args) => {
      let value = actionFunction(this.helpers, ...args);
      let renderNextForThisAction = true;

      if (value instanceof Action) {
        value = action.action();
        renderNextForThisAction = action.renderNextButton;
      }

      // Render next buttons? Calculate here to ensure this.renderNexts is set
      const nextIfNoOptions = this.renderNexts && !lastAction && renderNextForThisAction;

      // Add a post-script?
      let postScript = "";

      if (lastAction && this.postScript) {
        postScript = `\n\n${this.getPostScript()}`;
      }

      // If this isn't the last action and new value is ActionChain with options
      if (!lastAction && value && value.options) {
        throw Error("Custom options are only supported at the end of action chains.");
      }

      return this.handleValue(value, postScript, nextIfNoOptions, args);
    };
  }

  handleValue(value, postScript, nextIfNoOptions, args) {
    if (value instanceof ActionChain) {
      return value.chain(...args);
    } else if (typeof value === "string") {
      return this.dispatchAppend(`${value}${postScript}`, this.options, nextIfNoOptions, false);
    } else if (Array.isArray(value)) {
      // Each element is evaluated and concatenated
      const concatenated = value
        .map((text) => {
          if (typeof text === "function") {
            const result = text();

            if (result instanceof Text) {
              return result.next();
            }

            return result || "";
          } else if (text instanceof Text) {
            return text.next();
          }

          return text;
        })
        .join("\n\n");
      return this.dispatchAppend(`${concatenated}${postScript}`, this.options, nextIfNoOptions, false);
    } else if (value instanceof SequentialText) {
      return this.expandSequentialText(value, this.options, nextIfNoOptions, postScript);
    } else if (value instanceof Text) {
      return this.dispatchAppend(`${value.next()}${postScript}`, this.options, nextIfNoOptions, value.paged);
    } else if (value instanceof Interaction) {
      return getStore().dispatch(changeInteraction(value));
    } else if (value instanceof OptionGraph) {
      return this.handleOptionGraph(value, args, nextIfNoOptions);
    } else if (typeof value === "function") {
      return this.handleValue(value(this.helpers, ...args), postScript, nextIfNoOptions, args);
    }

    // This is an arbitrary action that shouldn't create a new interaction
    return value;
  }

  handleOptionGraph(optionGraph, args, nextIfNoOptions) {
    return optionGraph
      .commence()
      .chain(...args)
      .then(() => optionGraph.promise)
      .then(() => {
        if (nextIfNoOptions) {
          return this.dispatchAppend("", null, nextIfNoOptions);
        }
      });
  }

  getPostScript() {
    if (this.postScript instanceof Text) {
      return this.postScript.next();
    } else if (typeof this.postScript === "function") {
      return this.postScript();
    } else {
      return this.postScript;
    }
  }

  async expandSequentialText(sequentialText, options, nextIfNoOptions, postScript) {
    const texts = sequentialText.texts;
    for (let index = 0; index < texts.length; index++) {
      const lastPage = index === texts.length - 1;

      await this.dispatchAppend(
        `${texts[index]}${lastPage ? postScript : ""}`,
        lastPage ? options : null,
        nextIfNoOptions || !lastPage,
        sequentialText.paged
      );
    }
  }

  async chain(...args) {
    let chainResolve, result;
    const chainPromise = new Promise((resolve) => (chainResolve = resolve));
    getStore().dispatch(chainStarted(chainPromise));

    for (let i in this._actions) {
      const action = this._actions[i];

      result = await action(...args);

      if (this.failed) {
        // Failing an action breaks the chain
        break;
      }
    }

    chainResolve();
    getStore().dispatch(chainEnded(chainPromise));
    return result;
  }
}
