import Item from "./item";
import Room from "./room";
import { Event } from "./event";
import { selectGame } from "../utils/selectors";
import { getStore } from "../redux/storeRegistry";
import { addEvent } from "../redux/gameActions";
import { processEvent } from "../utils/evenUtils";

export class Npc extends Item {
  constructor(name, description) {
    super(name, description || `${name} is unremarkable.`, false);
    this.encounters = [];
  }

  async go(direction) {
    if (this.container instanceof Room) {
      const adjacent = this.container.adjacentRooms[direction];

      if (adjacent && adjacent.test()) {
        this.container.removeItem(this);
        adjacent.room.addItem(this);

        // Check encounters
        for (let i in this.encounters) {
          const encounter = this.encounters[i];
          processEvent(encounter); // Don't await to avoid deadlock
        }

        return true;
      }
    }

    return false;
  }

  addEncounter(...actions) {
    const encounter = new Event(
      actions,
      () => this.container === selectGame().room
    );
    this.encounters.push(encounter);
    getStore().dispatch(addEvent(encounter));
  }
}
