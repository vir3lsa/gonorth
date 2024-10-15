import { Item, customiseVerbs, omitAliases } from "./item";
import { Room } from "./room";
import { Event } from "../events/event";
import { getStore } from "../../redux/storeRegistry";
import { addEvent } from "../../redux/gameActions";
import { selectRoom } from "../../utils/selectors";

export class Npc extends Item {
  encounters: Event[];

  constructor(builder: Builder) {
    const { name, description, holdable, size, verbs, aliases, hidesItems, items, ...remainingConfig } = builder.config;
    super(name, description || `${name} is unremarkable.`, holdable, size, verbs, aliases, hidesItems, builder.config);
    this._isNpc = true; // Avoids circular dependency in item.js
    this.encounters = [];
    this.article = "";
    this.preposition = "to";

    this.addItems(...(items ?? []));

    // Set each remaining config value on the NPC.
    Object.entries(remainingConfig).forEach(([key, value]) => (this[key] = value));

    // Apply any verb modifications.
    customiseVerbs(remainingConfig.verbCustomisations, this);

    // Remove any unwanted aliases.
    omitAliases(remainingConfig.omitAliases, this);
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
          encounter.lifecycle(); // Don't await to avoid deadlock
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
    const encounter = new Event.Builder(`${this.name} encounter`)
      .withActions(...actions)
      .withCondition(condition)
      .isRecurring()
      .build();
    this.encounters.push(encounter);
    getStore().dispatch(addEvent(encounter));
  }

  static get Builder() {
    return Builder;
  }
}

class Builder extends Item.Builder {
  constructor(name: string) {
    super(name);
  }

  build() {
    return new Npc(this);
  }
}
