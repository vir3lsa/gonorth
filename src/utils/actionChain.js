import { changeInteraction } from "../redux/gameActions";
import Option from "../game/option";
import { Interaction, Append } from "../game/interaction";
import { getStore } from "../redux/storeRegistry";
import { Text, SequentialText, RandomText, TextWrapper } from "../game/text";

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

    if (typeof value === "string") {
      return dispatchAppend(value, options, !lastAction);
    } else if (Array.isArray(value) && typeof value[0] === "string") {
      return dispatchAppend(new SequentialText(value), options, !lastAction);
    } else if (value instanceof SequentialText) {
      return expandSequentialText(value, options, !lastAction);
    } else if (value instanceof Text) {
      return dispatchAppend(value, options, !lastAction, value.paged);
    } else if (value instanceof Interaction) {
      return getStore().dispatch(changeInteraction(value, !lastAction));
    }

    // This is an arbitrary action that shouldn't create a new interaction
    return result;
  };
}

function dispatchAppend(text, options, nextOnLastPage, clearPage) {
  const interactionType = clearPage ? Interaction : Append;

  return getStore().dispatch(
    changeInteraction(new interactionType(text, options, nextOnLastPage))
  );
}

async function expandSequentialText(sequentialText, options, nextOnLastPage) {
  const texts = sequentialText.texts;
  for (let index = 0; index < texts.length; index++) {
    const lastPage = index === texts.length - 1;
    await dispatchAppend(
      texts[index],
      lastPage ? options : null,
      nextOnLastPage || !lastPage,
      sequentialText.paged
    );
  }
}

export const chainActions = async (actions, ...args) => {
  for (let i in actions) {
    const action = actions[i];
    await action(...args);
  }
};
