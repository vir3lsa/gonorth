import { getStore } from "../redux/storeRegistry";

export const selectGame = () => getStore().getState().game.game;
