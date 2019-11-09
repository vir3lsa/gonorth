import {
  changeInteraction,
  chainStarted,
  chainEnded
} from "../redux/gameActions";
import { Interaction, Append } from "../game/interaction";
import { getStore } from "../redux/storeRegistry";
import { Text, SequentialText, TextWrapper } from "../game/text";

function toChainableFunction(action, i, actions) {
  let actionFunction = action;
  const lastAction = i === actions.length - 1;

  if (typeof actionFunction !== "function") {
    actionFunction = () => action;
  }

  return (...args) => {
    const result = actionFunction(...args);
    let value = result;
    let options;

    if (result instanceof TextWrapper) {
      options = result.options;
      value = result.text;
    }

    if (!lastAction && (options || (value && value.options))) {
      throw Error(
        "Custom options are only supported at the end of action chains."
      );
    }

    if (value instanceof ActionChain) {
      return chainActions(value);
    } else if (typeof value === "string") {
      return dispatchAppend(value, options, !lastAction, false);
    } else if (Array.isArray(value) && typeof value[0] === "string") {
      return expandSequentialText(
        new SequentialText(...value),
        options,
        !lastAction
      );
    } else if (value instanceof SequentialText) {
      return expandSequentialText(value, options, !lastAction);
    } else if (value instanceof Text) {
      return dispatchAppend(value.next(), options, !lastAction, value.paged);
    } else if (value instanceof Interaction) {
      return getStore().dispatch(changeInteraction(value));
    }

    // This is an arbitrary action that shouldn't create a new interaction
    return result;
  };
}

function dispatchAppend(text, options, nextIfNoOptions, clearPage) {
  const interactionType = clearPage ? Interaction : Append;

  return getStore().dispatch(
    changeInteraction(new interactionType(text, options, nextIfNoOptions))
  );
}

async function expandSequentialText(sequentialText, options, nextIfNoOptions) {
  const texts = sequentialText.texts;
  for (let index = 0; index < texts.length; index++) {
    const lastPage = index === texts.length - 1;
    await dispatchAppend(
      texts[index],
      lastPage ? options : null,
      nextIfNoOptions || !lastPage,
      sequentialText.paged
    );
  }
}

export class ActionChain {
  constructor(...actions) {
    if (actions.length === 1 && Array.isArray(actions[0])) {
      // An array was passed - unpack it
      this.actions = actions[0].map(toChainableFunction);
    } else {
      this.actions = actions.map(toChainableFunction);
    }
  }

  async chain(...args) {
    let chainResolve, result;
    const chainPromise = new Promise(resolve => (chainResolve = resolve));
    getStore().dispatch(chainStarted(chainPromise));

    for (let i in this.actions) {
      const action = this.actions[i];
      result = await action(...args);

      if (result === false) {
        // Returning false from an action breaks the chain
        break;
      }
    }

    chainResolve();
    getStore().dispatch(chainEnded(chainPromise));
    return result;
  }
}
