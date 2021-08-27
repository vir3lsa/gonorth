import { Room, Item, Verb } from "../../../../lib/gonorth";
import { mirrorEffects } from "../magic/magicEffects";

export const bedroom = new Room(
  "Bedroom",
  "You've reached the witch's lavish bed chamber. Dominating the space is a grand four-poster bed, bedecked in rich satin. Beside it is a modest bedside table. There's also an ornate dresser against one wall, its oversized mirror amplifying the room's dim light. The walls and ceiling are wooden, with no discernible breaks or gaps anywhere, and curve around to meet each other rather than joining at sharp corners. On the floor is the carpet you'd felt as you reached the top of the stairs. It actually appears to be a floor-filling rug with an elaborate design you can't quite make out from this angle.\n\nOn the Western side of the room the long staircase you ascended just now winds its way back down to the South hall."
);

const examine = new Verb(
  "examine",
  true,
  (helper, item, other) => {
    if (other) {
      return mirrorEffects.apply(item, other);
    } else {
      item.revealItems();
      return item.getFullDescription();
    }
  },
  null,
  ["ex", "x", "look", "inspect"]
);

examine.makePrepositional("with what", true);

const bedsideTable = new Item("bedside table", () => {
  let description =
    "It stands against the wall on four spindly legs. The top is polished to a dull gleam but is otherwise featureless.";

  if (!bedsideTable.itemArray.length) {
    description += " There's nothing on the table.";
  }

  return description;
});

bedsideTable.canHoldItems = true;
bedsideTable.preposition = "on";
bedsideTable.capacity = 3;
bedsideTable.addVerb(examine);

// Temp
const ball = new Item("ball", "It's a red ball.", true, 1);
ball.addVerb(examine);
// Temp

const dresser = new Item(
  "dresser",
  "Painted a bright white, the dressing table is a lovely thing. All elegant curves, clean lines, and filigreed brass handles, it wouldn't look out of place as the prize exhibit of an antique salesman's shop. Arguably even more beguiling is the silvery mirror adorning the dresser's top, gleaming despite the dim light."
);
dresser.aliases = ["dressing table", "dressing", "table"];
dresser.addVerb(examine);

const mirror = new Item(
  "mirror",
  "At first glance it appears entirely like an ordinary mirror - flat, reflective, projecting the room back at you. As you continue to gaze at it, it begins to resemble something from a fairground Hall of Mirrors, twisting and distorting the things it shows you. It goes even further than that, you realise, completely changing some of the objects reflected in its enchanted surface. You feel the need to inspect everything you can see, just to discover in what bizarre and unexpected ways the mirror has changed them."
);

mirrorEffects.add(
  dresser,
  mirror,
  true,
  "You can't see much of the dresser in the mirror as the mirror is attached to it, but, what you can see by getting the angle just right is that the clean, white-painted, wooden surface has been replaced with what looks like dense foliage, as though the whole table is made from dark green leaves, gently swaying in some phantom breeze."
);

mirrorEffects.add(ball, mirror, true, "It's a frog!");

bedroom.addItems(bedsideTable, ball, dresser, mirror);
