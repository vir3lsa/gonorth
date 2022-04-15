import { getStore } from "../redux/storeRegistry";

export const selectCurrentPage = () => getStore().getState().interaction.currentPage;
export const selectOptions = () => getStore().getState().interaction.options;
export const selectInteraction = () => getStore().getState().interaction;