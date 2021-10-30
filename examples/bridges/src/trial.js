export class Trial {
  constructor(grid, startCoordinates) {
    this.grid = grid;
    this.playerCoordinates = startCoordinates;
  }

  goNorth() {
    return this.go([0, 1]);
  }

  goSouth() {
    return this.go([0, -1]);
  }

  goEast() {
    return this.go([1, 0]);
  }

  goWest() {
    return this.go([-1, 0]);
  }

  go(vector) {
    const coordinates = [this.playerCoordinates[0] + vector[0], this.playerCoordinates[1] + vector[1]];
    const column = this.grid[coordinates[0]];

    if (column) {
      const tile = column[coordinates[1]];

      if (tile) {
        if (tile.terrain.traversable) {
          this.playerCoordinates = coordinates;
          return "you move";
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
