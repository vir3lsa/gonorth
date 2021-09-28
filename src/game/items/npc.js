import { Item } from "./item";
import { Room } from "./room";
import { Event } from "../events/event";
import { selectGame } from "../../utils/selectors";
import { getStore } from "../../redux/storeRegistry";
import { addEvent } from "../../redux/gameActions";
import { processEvent } from "../../utils/eventUtils";

export class Npc extends Item {
  constructor(name, description) {
    super(name, description || `${name} is unremarkable.`, false);
    this.isNpc = true; // Avoids circular dependency in item.js
    this.encounters = [];
    this.article = "";
    this.preposition = "to";
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
      `${this.name} encounter`,
      actions,
      () => this.container === selectGame().room
    );
    encounter.recurring = true;
    this.encounters.push(encounter);
    getStore().dispatch(addEvent(encounter));
  }
}
