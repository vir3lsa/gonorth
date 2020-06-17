import {
  changeInteraction,
  chainStarted,
  chainEnded
} from "../redux/gameActions";
import { Interaction, Append } from "../game/interactions/interaction";
import { getStore } from "../redux/storeRegistry";
import { Text, SequentialText } from "../game/interactions/text";

export class ActionChain {
  constructor(...actions) {
    this.actions = actions;
    this.renderNexts = true;
    this.renderOptions = true;
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
    this._actions = actions.map((action, i, actions) =>
      this.toChainableFunction(action, i, actions)
    );
  }

  insertAction(action) {
    this._actions.unshift(
      this.toChainableFunction(action, 0, [action, ...this._actions])
    );
  }

  insertActions(...actions) {
    actions.reverse().forEach(action => this.insertAction(action));
  }

  dispatchAppend(text, options, nextIfNoOptions, clearPage) {
    const interactionType = clearPage ? Interaction : Append;

    return getStore().dispatch(
      changeInteraction(
        new interactionType(text, options, nextIfNoOptions, this.renderOptions)
      )
    );
  }

  toChainableFunction(action, i, actions) {
    let actionFunction = action;
    const lastAction = i === actions.length - 1;

    if (typeof actionFunction !== "function") {
      actionFunction = () => action;
    }

    return (...args) => {
      const value = actionFunction(this.helpers, ...args);

      // Render next buttons? Calculate here to ensure this.renderNexts is set
      const nextIfNoOptions = this.renderNexts && !lastAction;

      // Add a post-script?
      let postScript = "";

      if (lastAction && this.postScript) {
        postScript = `\n\n${this.getPostScript()}`;
      }

      // If this isn't the last action and new value is ActionChain with options
      if (!lastAction && value && value.options) {
        throw Error(
          "Custom options are only supported at the end of action chains."
        );
      }

      if (value instanceof ActionChain) {
        return value.chain(...args);
      } else if (typeof value === "string") {
        return this.dispatchAppend(
          `${value}${postScript}`,
          this.options,
          nextIfNoOptions,
          false
        );
      } else if (Array.isArray(value)) {
        // Each element is evaluated and concatenated
        const concatenated = value
          .map(text => {
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
        return this.dispatchAppend(
          `${concatenated}${postScript}`,
          this.options,
          nextIfNoOptions,
          false
        );
      } else if (value instanceof SequentialText) {
        return this.expandSequentialText(
          value,
          this.options,
          nextIfNoOptions,
          postScript
        );
      } else if (value instanceof Text) {
        return this.dispatchAppend(
          `${value.next()}${postScript}`,
          this.options,
          nextIfNoOptions,
          value.paged
        );
      } else if (value instanceof Interaction) {
        return getStore().dispatch(changeInteraction(value));
      }

      // This is an arbitrary action that shouldn't create a new interaction
      return value;
    };
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

  async expandSequentialText(
    sequentialText,
    options,
    nextIfNoOptions,
    postScript
  ) {
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
    const chainPromise = new Promise(resolve => (chainResolve = resolve));
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
