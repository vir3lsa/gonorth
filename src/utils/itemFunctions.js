/*
 * Moves an item to a new container.
 */
export function moveItem(item, to) {
  item.container.removeItem(item);
  to.addItem(item);
  item.containerListing = null;
}
