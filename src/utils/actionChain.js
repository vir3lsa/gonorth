import {
  changeInteraction,
  chainStarted,
  chainEnded
} from "../redux/gameActions";
import { Interaction, Append } from "../game/interactions/interaction";
import { getStore } from "../redux/storeRegistry";
import { Text, SequentialText } from "../game/interactions/text";

function dispatchAppend(text, options, nextIfNoOptions, clearPage) {
  const interactionType = clearPage ? Interaction : Append;

  return getStore().dispatch(
    changeInteraction(new interactionType(text, options, nextIfNoOptions))
  );
}

export class ActionChain {
  constructor(...actions) {
    this.actions = actions;
    this.renderNexts = true;
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
    if (actions.length === 1 && Array.isArray(actions[0])) {
      // An array was passed - unpack it
      this._actions = actions[0].map((action, i, actions) =>
        this.toChainableFunction(action, i, actions)
      );
    } else {
      this._actions = actions.map((action, i, actions) =>
        this.toChainableFunction(action, i, actions)
      );
    }
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
        postScript = `\n\n${this.postScript}`;
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
        return dispatchAppend(
          `${value}${postScript}`,
          this.options,
          nextIfNoOptions,
          false
        );
      } else if (Array.isArray(value) && typeof value[0] === "string") {
        return this.expandSequentialText(
          new SequentialText(...value),
          this.options,
          nextIfNoOptions,
          postScript
        );
      } else if (value instanceof SequentialText) {
        return this.expandSequentialText(
          value,
          this.options,
          nextIfNoOptions,
          postScript
        );
      } else if (value instanceof Text) {
        return dispatchAppend(
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

  async expandSequentialText(
    sequentialText,
    options,
    nextIfNoOptions,
    postScript
  ) {
    const texts = sequentialText.texts;
    for (let index = 0; index < texts.length; index++) {
      const lastPage = index === texts.length - 1;

      await dispatchAppend(
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
