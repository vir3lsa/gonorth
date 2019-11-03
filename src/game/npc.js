import Item from "./item";
import Room from "./room";

export class Npc extends Item {
  constructor(name, description) {
    super(name, description || `${name} is unremarkable.`, false);
  }

  go(direction) {
    if (this.container instanceof Room) {
      const adjacent = this.container.adjacentRooms[direction];

      if (adjacent && adjacent.test()) {
        this.container.removeItem(this);
        adjacent.room.addItem(this);

        return true;
      }
    }

    return false;
  }
}
