import { changeInteraction } from "../redux/gameActions";
import Option from "../game/option";
import Interaction from "../game/interaction";
import { getStore } from "../redux/storeRegistry";

export const toChainableFunction = (action, i, actions) => {
  const lastAction = i === actions.length - 1;

  if (typeof action === "string") {
    return () => {
      if (lastAction) {
        // No "Next" button if this is the last action
        getStore().dispatch(changeInteraction(new Interaction(action)));
      } else {
        return new Promise(resolve => {
          getStore().dispatch(
            changeInteraction(
              new Interaction(action, new Option("Next", resolve))
            )
          );
        });
      }
    };
  } else if (action instanceof Interaction) {
    return () => getStore().dispatch(changeInteraction(action));
  } else {
    return (...args) => {
      const result = action(...args);

      if (typeof result === "string") {
        if (lastAction) {
          getStore().dispatch(changeInteraction(new Interaction(result)));
        } else {
          return new Promise(resolve =>
            getStore().dispatch(
              changeInteraction(
                new Interaction(result, new Option("Next", resolve))
              )
            )
          );
        }
      } else if (result instanceof Interaction) {
        return getStore().dispatch(changeInteraction(result));
      }

      return result;
    };
  }
};

export const chainActions = async (actions, ...args) => {
  for (let i in actions) {
    const action = actions[i];
    await action(...args);
  }
};
