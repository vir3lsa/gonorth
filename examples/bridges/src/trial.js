import { RandomText, Item, Room, Verb, getKeyword, removeKeyword, getBasicItemList, toTitleCase } from "@gonorth";

export class Terrain extends Item {
  constructor(name, traversable, supportive, article, preposition, items = {}) {
    super(name);
    this.traversable = traversable;
    this.supportive = supportive;
    this.article = article;
    this.preposition = preposition;
    this.items = items;
  }

  cloneWith(newParams) {
    const newTerrain = new Terrain(
      this.name,
      this.traversable,
      this.supportive,
      this.article,
      this.preposition,
      this.items
    );
    Object.entries(newParams).forEach(([key, value]) => (newTerrain[key] = value));
    return newTerrain;
  }
}

const northText = new RandomText("North", "forward", "straight ahead", "straight on");
const southText = new RandomText("South", "backward", "back", "in reverse");
const eastText = new RandomText("East", "Eastward", "to the right", "to your right");
const westText = new RandomText("West", "Westward", "to the left", "to your left");
const moveText = new RandomText(
  (direction) => `You walk ${direction}.`,
  (direction) => `You take a few steps ${direction}.`,
  (direction) => `You move ${direction}.`,
  (direction) => `You go ${direction}.`,
  (direction) => `You step ${direction}.`,
  (direction) => `Walking ${direction}.`,
  (direction) => `Taking a few steps ${direction}.`,
  (direction) => `Moving ${direction}.`,
  (direction) => `Going ${direction}.`,
  (direction) => `Stepping ${direction}.`
);

const outOfBoundsText = new RandomText(
  "Can't go that way - you've reached the edge of the clearing.",
  "There's nothing but densely packed pines that way.",
  "That would take you out of bounds, which isn't permitted by the trial's rules."
);

const nonTraversableText = new RandomText(
  (terrain) => `You can't go that way - there's ${terrain.article} ${terrain.name} in the way.`,
  (terrain) => `${terrain.article.toUpperCase()} ${terrain.name} blocks your path.`,
  (terrain) => `The way is blocked by ${terrain.article} ${terrain.name}.`
);

const lookStartText = new RandomText(
  (direction) => `To the ${direction.name} you see `,
  (direction) => `Looking ${direction.name}, there's `,
  (direction) => `Gazing to the ${direction.name}, you can see `,
  (direction) => `Directly ${direction.name} of you there's `,
  (direction) => `Turning your head to the ${direction.name}, you see `,
  (direction) => `Immediately to the ${direction.name} there's `,
  "You see ",
  "There's "
);

const lookMidText = new RandomText(
  "After that there's ",
  "Beyond that you see ",
  "Further on there's ",
  "Next, you can make out ",
  (terrain) => `Beyond the ${terrain.name} there's `,
  (terrain) => `After the ${terrain.name} you see `
);

const lookEndText = new RandomText(
  "a dense wall of trees beyond the edge of the boundary.",
  "the edge of the trial arena.",
  "nothing but the thick forest.",
  "only the dark woods.",
  "the edge of the clearing.",
  "the boundary."
);

const viewBlockedText = new RandomText(
  "You can't see beyond that.",
  (terrain) => `You can't see beyond the ${terrain.name}.`,
  (terrain) => `It's impossible to see what's behind the ${terrain.name}.`,
  "Anything beyond that's blocked from view.",
  (terrain) => `The ${terrain.name} is hiding whatever might be behind it.`
);

export const grassTerrain = new Terrain("grass", false, true, "", "on");
export const riverTerrain = new Terrain("river", false, false, "the");
export const ditchTerrain = new Terrain("ditch", false, false, "a");
export const menhirTerrain = new Terrain("menhir", false, false, "a", "on");
export const rockTerrain = new Terrain("rock", false, true, "", "on");
export const airTerrain = new Terrain("air", true, false, "");
export const yourSigilTerrain = new Terrain("your sigil", true, false, "");
export const tutorSigilTerrain = new Terrain("tutor's sigil", true, false, "");

export class Trial extends Room {
  constructor(name, description, grid, startCoordinates) {
    super(name, description);
    this.grid = grid;
    this.playerCoordinates = startCoordinates;
    this._setUpDirections();
  }

  _setUpDirections() {
    // Model the directions as objects so we can examine them.
    this.north = new Item.Builder()
      .withName("North")
      .withAliases("n", "northward", "straight on", "straight", "ahead", "forward")
      .build();
    this.south = new Item.Builder()
      .withName("South")
      .withAliases("s", "southward", "back", "backward", "backwards", "behind")
      .build();
    this.east = new Item.Builder().withName("East").withAliases("e", "eastward", "right").build();
    this.west = new Item.Builder().withName("West").withAliases("w", "westward", "left").build();

    const lookVerb = new Verb("examine", true, (helpers, item) => this.look(item), null, [
      "ex",
      "x",
      "look",
      "inspect"
    ]);
    this.north.addVerb(lookVerb);
    this.south.addVerb(lookVerb);
    this.east.addVerb(lookVerb);
    this.west.addVerb(lookVerb);

    // Add the directions as items so we can look at them.
    this.addItems(this.north, this.south, this.east, this.west);

    // Set up special directional verbs to move about within the trial. Equivalent keywords will need to  be removed.
    this.addVerbs(
      new Verb("North", true, () => this.goNorth(), null, ["n", "forward", "straight on"], true),
      new Verb("South", true, () => this.goSouth(), null, ["s", "backward", "backwards", "back", "reverse"], true),
      new Verb("East", true, () => this.goEast(), null, ["e", "right", "r"], true),
      new Verb("West", true, () => this.goWest(), null, ["w", "left", "l"], true)
    );

    // Remove directional keywords, if present.
    setTimeout(() => {
      if (getKeyword("north")) {
        removeKeyword("north");
        removeKeyword("south");
        removeKeyword("east");
        removeKeyword("west");
      }
    });
  }

  goNorth() {
    return this.go([0, 1], northText.next());
  }

  goSouth() {
    return this.go([0, -1], southText.next());
  }

  goEast() {
    return this.go([1, 0], eastText.next());
  }

  goWest() {
    return this.go([-1, 0], westText.next());
  }

  go(vector, direction) {
    const coordinates = [
      this.playerCoordinates[0] + vector[0],
      this.playerCoordinates[1] + vector[1],
      this.playerCoordinates[2]
    ];

    const [tile, subtile] = this.getTerrain(coordinates);

    if (!tile || !subtile) {
      return outOfBoundsText.next();
    }

    if (!tile.traversable) {
      return nonTraversableText.next(tile);
    }

    if (!subtile.supportive) {
      return nonTraversableText.next(subtile);
    }

    this.playerCoordinates = coordinates;
    return moveText.next(direction);
  }

  /*
   * Gets the tile (voxel) at the coordinates specified, and the one beneath it, as an array. The elements will be null
   * if the coordinates are out of bounds.
   */
  getTerrain(coordinates) {
    const layer = this.grid[coordinates[2]];
    const sublayer = this.grid[coordinates[2] - 1];

    const column = layer && layer[coordinates[0]];
    const subcolumn = sublayer && sublayer[coordinates[0]];

    const tile = column && column[coordinates[1]];
    const subtile = subcolumn && subcolumn[coordinates[1]];

    return [tile || null, subtile || null];
  }

  look(direction) {
    let vector;

    switch (direction) {
      case this.north:
        vector = [0, 1, 0];
        break;
      case this.south:
        vector = [0, -1, 0];
        break;
      case this.east:
        vector = [1, 0, 0];
        break;
      case this.west:
        vector = [-1, 0, 0];
        break;
    }

    let coordinates = [...this.playerCoordinates];
    let result = lookStartText.next(direction);
    let lastTerrain, terrain, subterrain, nextTerrain, nextSubterrain;

    const getNextCoordinates = (coordinates) => [
      coordinates[0] + vector[0],
      coordinates[1] + vector[1],
      coordinates[2] + vector[2]
    ];

    const getNextTerrain = () => {
      coordinates = getNextCoordinates(coordinates);
      [terrain, subterrain] = this.getTerrain(coordinates);
      const nextCoordinates = getNextCoordinates(coordinates);
      [nextTerrain, nextSubterrain] = this.getTerrain(nextCoordinates);
    };

    getNextTerrain();

    while (terrain && terrain.traversable && subterrain) {
      if (subterrain !== lastTerrain) {
        result += `${subterrain.article} ${subterrain.name}.`;
        lastTerrain = subterrain;
      }

      if (terrain.uniqueItems.size) {
        result += ` ${toTitleCase(subterrain.preposition)} the ${subterrain.name} there's ${getBasicItemList([
          ...terrain.uniqueItems
        ])}.`;
      }

      if (subterrain !== nextSubterrain || !nextTerrain.traversable) {
        result += ` ${lookMidText.next(subterrain)}`;
      }

      getNextTerrain();
    }

    if (terrain && !terrain.traversable) {
      result += `${terrain.article} ${terrain.name}. ${viewBlockedText.next(terrain)}`;
    } else if (!terrain) {
      result += lookEndText.next();
    }

    return result;
  }
}
