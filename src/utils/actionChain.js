import {
  changeInteraction,
  chainStarted,
  chainEnded
} from "../redux/gameActions";
import { Interaction, Append } from "../game/interaction";
import { getStore } from "../redux/storeRegistry";
import { Text, SequentialText, TextWrapper } from "../game/text";

export const createChainableFunction = actions => {
  const actionArray = Array.isArray(actions) ? actions : [actions];
  return actionArray.map(toChainableFunction);
};

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

    if (typeof value === "string") {
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

export const chainActions = async (actions, ...args) => {
  let chainResolve, result;
  const chainPromise = new Promise(resolve => (chainResolve = resolve));
  getStore().dispatch(chainStarted(chainPromise));

  for (let i in actions) {
    const action = actions[i];
    result = await action(...args);

    if (result === false) {
      // Returning false from an action breaks the chain
      break;
    }
  }

  chainResolve();
  getStore().dispatch(chainEnded(chainPromise));
  return result;
};
