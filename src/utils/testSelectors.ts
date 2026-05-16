import { getStore } from "../redux/storeRegistry";
import { OptionT } from "../types/types";

export const selectCurrentPage = () => getStore().getState().interaction.currentPage;
export const selectOptions = (): OptionT[] => getStore().getState().interaction.options;
export const selectInteraction = () => getStore().getState().interaction;
export const selectImage = () => getStore().getState().image;
export const selectRoomName = () => getStore().getState().roomName;