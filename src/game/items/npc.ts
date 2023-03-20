import { Item } from "./item";
import { Room } from "./room";
import { Event } from "../events/event";
import { getStore } from "../../redux/storeRegistry";
import { addEvent } from "../../redux/gameActions";
import { processEvent } from "../../utils/eventUtils";
import { selectRoom } from "../../utils/selectors";

export class Npc extends Item {
  encounters: Event[];

  constructor(name: string, description: UnknownText) {
    super(name, description || `${name} is unremarkable.`, false);
    this._isNpc = true; // Avoids circular dependency in item.js
    this.encounters = [];
    this.article = "";
    this.preposition = "to";
  }

  roomIsRoom(room: any): room is Room {
    return Boolean(room.isRoom);
  }

  async go(direction: DirectionName) {
    if (this.container instanceof Room) {
      const adjacent = this.container.adjacentRooms[direction];

      // TODO Attempt to open the door if there is one, then retry the test.
      if (adjacent?.test?.()) {
        this.container.removeItem(this);

        if (this.roomIsRoom(adjacent.room)) {
          adjacent.room?.addItem(this);
        }

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

  addEncounter(...actions: Action[]) {
    this.addEncounterWithCondition(() => this.container === selectRoom(), ...actions);
  }

  addEncounterWithCondition(condition: Condition, ...actions: Action[]) {
    const encounter = new Event(`${this.name} encounter`, actions, condition);
    encounter.recurring = true;
    this.encounters.push(encounter);
    getStore().dispatch(addEvent(encounter));
  }
}
