import { Room, Item } from "../../../../lib/gonorth";

export const bedroom = new Room("Bedroom", "You've reached the witch's lavish bed chamber. Dominating the space is a grand four-poster bed, bedecked in rich satin. Beside it is a modest bedside table. There's also an ornate dresser against one wall, its oversized mirror amplifying the room's dim light. The walls and ceiling are wooden, with no discernible breaks or gaps anywhere, and curve around to meet each other rather than joining at sharp corners. On the floor is the carpet you'd felt as you reached the top of the stairs. It actually appears to be a floor-filling rug with an elaborate design you can't quite make out from this angle.\n\nOn the Western side of the room the long staircase you ascended just now winds its way back down to the South hall.");

const bedsideTable = new Item("bedside table", () => {
  let description = "It stands against the wall on four spindly legs. The top is polished to a dull gleam but is otherwise featureless."

  if (!bedsideTable.itemArray.length) {
    description += " There's nothing on the table."
  }

  return description;
});

bedsideTable.canHoldItems = true;
bedsideTable.preposition = "on";
bedsideTable.capacity = 3;

// Temp
const ball = new Item("ball", "It's a red ball.", true, 1);
// Temp

const dresser = new Item("dresser", "placeholder");
dresser.aliases = ["dressing table", "dressing", "table"];

bedroom.addItems(bedsideTable, ball, dresser);