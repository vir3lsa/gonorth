import { Room, Item, Verb, selectInventory, setHintNodeId } from "../../../../lib/gonorth";
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
dresser.addAliases("dressing table", "dressing", "table");
dresser.canHoldItems = true;
dresser.preposition = "on";
dresser.capacity = 5;
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

const keepsakeBox = new Item(
  "keepsake box",
  () => {
    if (keepsakeBox.solidity === 1) {
      return "The box is visible more as an impression or a shadow. If you look directly at it you can barely see it at all, but squint or turn your head to look at it from the corner of your eye and you can definitely make out that *something* is there. It's like the reflection of a reflection glimpsed in a window's glass.";
    } else if (keepsakeBox.solidity === 2) {
      return "It's much easier to see now, though it's still translucent. Looking at it reminds you of that effect when you close one eye and try to touch the tips of the index fingers of each hand, struggling against the lack of depth perception. It lacks a certain solidity, or corporeality, like it's an illusion or a trick played with mirrors. Which, upon reflection, you suppose it is. A reflection made material.";
    } else if (keepsakeBox.solidity >= 3) {
      return "It's completely solid now, giving no hint that it apparently materialised from thin air. It's a walnut keepsake box with a delicately engraved scene of a forest at night, complete with crescent moon, owl and cat. The corners are rounded and the two parts are connected with a pair of brass hinges. It's currently closed.";
    }
  },
  true,
  2
);
keepsakeBox.addAliases("jewellery");
keepsakeBox.addVerb(examine);

const originalTest = keepsakeBox.verbs.take.test;
keepsakeBox.verbs.take.test = () => originalTest() && keepsakeBox.solidity >= 3;
keepsakeBox.verbs.take.onSuccess.addAction(
  "You half expect it to disappear or slip through your fingers as you reach for it, but it does neither. It feels sturdy and real, like a perfectly normal box."
);
keepsakeBox.verbs.take.onFailure.addAction(() => {
  const inventory = selectInventory();
  if (
    keepsakeBox.container.itemsVisibleFromSelf &&
    keepsakeBox.container !== inventory &&
    (inventory.capacity === -1 || keepsakeBox.size <= inventory.free)
  ) {
    return "You try to pick it up but when you lean forward to do so your hand grasps at nothing but thin air. It's like trying to touch your index fingers together with one eye closed, or like the vain attempts of a cat to pounce on the patterns created by sunlight streaming through a glass bauble.";
  }
});

mirrorEffects.add(bedsideTable, mirror, true, [
  () => {
    if (!keepsakeBox.solidity) {
      setHintNodeId("bedroomBox");
      return "The small table looks much the same as before when viewed in the mirror, but...there's something on top of it, where it was empty before. It looks like a wooden keepsake or jewellery box, not much larger than the hand, with brass hinges. It's closed.";
    }

    return "When viewed in the mirror, the bedside table has a small keepsake box on it.";
  },
  () => {
    if (!keepsakeBox.solidity) {
      bedsideTable.addItem(keepsakeBox);
      keepsakeBox.solidity = 1;
      mirrorEffects.add(keepsakeBox, mirror, true, () => {
        keepsakeBox.solidity++;

        if (keepsakeBox.solidity === 2) {
          return "Focussing on the box in the mirror, it solidifies in your mind, becoming more real. You can make out the fine details of the scene carved into the lid and the grain of the wood beneath the glossy varnish.";
        }

        return "You stare intently at the image of the box in the mirror, willing it into reality. You fix your gaze on every detail in turn, holding it in your mind such that you can recall each curve, line and shape without needing to look. There. You feel certain of the box's solidity now, sure that you could touch it, hold it.";
      });
    }
  }
]);

mirrorEffects.add(ball, mirror, true, "It's a frog!");

bedroom.addItems(bedsideTable, ball, dresser, mirror);
