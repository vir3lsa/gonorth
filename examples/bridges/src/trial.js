import { RandomText } from "@gonorth";

export class Terrain {
  constructor(name, traversable, supportive) {
    this.name = name;
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

export const grassTerrain = new Terrain("grass", false, true);
export const riverTerrain = new Terrain("river", false, false);
export const ditchTerrain = new Terrain("ditch", false, false);
export const menhirTerrain = new Terrain("menhir", false, false);
export const rockTerrain = new Terrain("rock", false, true);
export const airTerrain = new Terrain("air", true, false);
export const yourSigilTerrain = new Terrain("your sigil", true, false);
export const tutorSigilTerrain = new Terrain("tutor's sigil", true, false);

export class Trial {
  constructor(grid, startCoordinates) {
    this.grid = grid;
    this.playerCoordinates = startCoordinates;
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
      return "out of bounds";
    }

    const column = layer[coordinates[0]];
    const subcolumn = sublayer[coordinates[0]];

    if (!column || !subcolumn) {
      return "out of bounds";
    }

    const tile = column[coordinates[1]];
    const subtile = subcolumn[coordinates[1]];

    if (!tile || !subtile) {
      return "out of bounds";
    }

    if (!tile.traversable || !subtile.supportive) {
      return "can't go that way";
    }

    this.playerCoordinates = coordinates;
    return moveText.next(direction);
  }
}
