import { selectItem } from "./selectors";

/*
 * (Silently) moves an item to a new container.
 */
export function moveItem(item: ItemOrString, to: ItemRoomOrString) {
  let itemObj: ItemT | undefined;
  let toObj: ItemOrRoom | undefined;

  if (typeof item === "string" || item instanceof String) {
    itemObj = getItem(item as string);
  } else {
    itemObj = item;
  }

  if (typeof to === "string" || to instanceof String) {
    toObj = getItem(to as string);
  } else {
    toObj = to;
  }

  if (!itemObj) {
    throw Error(`Tried to move item "${item}" but couldn't find it.`);
  }

  if (!toObj) {
    throw Error(`Tried to move item to ${to} but couldn't find the latter.`);
  }

  if (itemObj?.container) {
    itemObj!.container.removeItem(itemObj);
  }

  toObj?.addItem(itemObj);
  itemObj.containerListing = undefined;
}

export function getItem(name: string) {
  const items = selectItem(name);
  const itemList = items ? [...items] : [];

  if (itemList.length > 1) {
    throw Error(
      `Tried to get an item called '${name}' but got several with the same alias. Use the item's unique name instead.`
    );
  } else if (!itemList.length) {
    return;
  }

  return itemList[0];
}
