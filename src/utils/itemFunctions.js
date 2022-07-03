import { selectItem } from "./selectors";

/*
 * (Silently) moves an item to a new container.
 */
export function moveItem(item, to) {
  let itemObj = item;
  let toObj = to;

  if (typeof item === "string" || item instanceof String) {
    itemObj = getItem(item);
  }

  if (typeof to === "string" || to instanceof String) {
    toObj = getItem(to);
  }

  if (itemObj.container) {
    itemObj.container.removeItem(itemObj);
  }

  toObj.addItem(itemObj);
  itemObj.containerListing = null;
}

export function getItem(name) {
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
