import { RandomText, Item, Room, Verb, getKeyword, removeKeyword } from "@gonorth";

export class Terrain extends Item {
  constructor(name, traversable, supportive) {
    super(name);
    this.traversable = traversable;
    this.supportive = supportive;
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

export const grassTerrain = new Terrain("grass", false, true);
export const riverTerrain = new Terrain("river", false, false);
export const ditchTerrain = new Terrain("ditch", false, false);
export const menhirTerrain = new Terrain("menhir", false, false);
export const rockTerrain = new Terrain("rock", false, true);
export const airTerrain = new Terrain("air", true, false);
export const yourSigilTerrain = new Terrain("your sigil", true, false);
export const tutorSigilTerrain = new Terrain("tutor's sigil", true, false);

export class Trial extends Room {
  constructor(name, description, grid, startCoordinates) {
    super(name, description);
    this.grid = grid;
    this.playerCoordinates = startCoordinates;
    this._setUpDirections();
  }

  _setUpDirections() {
    // Model the directions as objects so we can examine them.
    const north = new Item.Builder()
      .withName("North")
      .withAliases("n", "northward", "straight on", "straight", "ahead", "forward")
      .build();
    const south = new Item.Builder()
      .withName("South")
      .withAliases("s", "southward", "back", "backward", "backwards", "behind")
      .build();
    const east = new Item.Builder().withName("East").withAliases("e", "eastward", "left").build();
    const west = new Item.Builder().withName("West").withAliases("w", "westward", "left").build();

    const lookVerb = new Verb("examine", true, (helpers, item) => this.look(item), null, [
      "ex",
      "x",
      "look",
      "inspect"
    ]);
    north.addVerb(lookVerb);
    south.addVerb(lookVerb);
    east.addVerb(lookVerb);
    west.addVerb(lookVerb);

    this.addItems(north, south, east, west);

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
    const layer = this.grid[coordinates[2]];
    const sublayer = this.grid[coordinates[2] - 1];

    if (!layer || !sublayer) {
      return outOfBoundsText.next();
    }

    const column = layer[coordinates[0]];
    const subcolumn = sublayer[coordinates[0]];

    if (!column || !subcolumn) {
      return outOfBoundsText.next();
    }

    const tile = column[coordinates[1]];
    const subtile = subcolumn[coordinates[1]];

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

  look(direction) {
    return `Looking ${direction.name}`;
  }
}
