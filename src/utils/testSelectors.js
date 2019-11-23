import { getStore } from "../redux/storeRegistry";

export const selectCurrentPage = () =>
  getStore().getState().game.interaction.currentPage;
