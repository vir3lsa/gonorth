import { getStore } from "../redux/storeRegistry";

export const selectCurrentPage = () =>
  getStore().getState().game.interaction.currentPage;
export const selectOptions = () =>
  getStore().getState().game.interaction.options;
