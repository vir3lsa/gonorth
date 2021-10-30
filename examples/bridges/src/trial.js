import { RandomText } from "@gonorth";

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
    const coordinates = [this.playerCoordinates[0] + vector[0], this.playerCoordinates[1] + vector[1]];
    const column = this.grid[coordinates[0]];

    if (column) {
      const tile = column[coordinates[1]];

      if (tile) {
        if (tile.terrain.traversable) {
          this.playerCoordinates = coordinates;
          return moveText.next(direction);
        } else {
          return "can't go that way";
        }
      } else {
        return "out of bounds";
      }
    } else {
      return "out of bounds";
    }
  }
}

export class Terrain {
  constructor(name, traversable) {
    this.name = name;
    this.traversable = traversable;
  }
}
