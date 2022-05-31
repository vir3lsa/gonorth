/*
 * Moves an item to a new container.
 */
export function moveItem(item, to) {
  if (item.container) {
    item.container.removeItem(item);
  }
  
  to.addItem(item);
  item.containerListing = null;
}
