import { changeInteraction } from "../redux/gameActions";
import Option from "../game/option";
import { Interaction, Append } from "../game/interaction";
import { getStore } from "../redux/storeRegistry";
import { Text, SequentialText } from "../game/text";

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

    if (typeof result === "string") {
      return dispatchAppend(result, !lastAction);
    } else if (Array.isArray(result) && typeof result[0] === "string") {
      return dispatchAppend(new SequentialText(result), !lastAction);
    } else if (result instanceof Text) {
      return dispatchAppend(result, !lastAction, result.paged);
    } else if (result instanceof Interaction) {
      return getStore().dispatch(changeInteraction(result, !lastAction));
    }

    // This is an arbitrary action that shouldn't create a new interaction
    return result;
  };
}

function dispatchAppend(text, nextOnLastPage, clearPage) {
  const interactionType = clearPage ? Interaction : Append;

  return getStore().dispatch(
    changeInteraction(new interactionType(text, null, nextOnLastPage))
  );
}

export const chainActions = async (actions, ...args) => {
  for (let i in actions) {
    const action = actions[i];
    await action(...args);
  }
};
