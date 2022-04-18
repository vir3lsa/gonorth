import {
  Room,
  Item,
  Verb,
  selectInventory,
  setHintNodeId,
  selectPlayer,
  Schedule,
  TIMEOUT_MILLIS,
  TIMEOUT_TURNS,
  inSameRoomAs,
  SequentialText,
  Container
} from "../../../../lib/gonorth";
import { mirrorEffects } from "../magic/magicEffects";
import { MagicWord } from "../magic/magicWord";
import { catGraph } from "./snug/cat";
import { memoCard } from "./snug/snug";

export const bedroom = new Room(
  "Bedroom",
  "You've reached the witch's lavish bed chamber. Dominating the space is a grand four-poster bed, bedecked in rich satin. Beside it is a modest bedside table. There's also an ornate dresser against one wall, its oversized mirror amplifying the room's dim light. The walls and ceiling are wooden, with no discernible breaks or gaps anywhere, and curve around to meet each other rather than joining at sharp corners. On the floor is the carpet you'd felt as you reached the top of the stairs. It actually appears to be a floor-filling rug with an elaborate design you can't quite make out from this angle.\n\nOn the Western side of the room the long staircase you ascended just now winds its way back down to the South hall.",
  true
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

const biscuits = new Item(
  "biscuits",
  "They're a beige colour and smell faintly fishy. Each one is no larger than a tooth."
);
biscuits.addAliases("biscuit", "treat", "treats");
biscuits.addVerb(
  new Verb(
    "eat",
    true,
    "You pop one of the biscuits into your mouth and crunch it up. Yep, it's definitely fish-flavoured. You swallow it with a grimace."
  )
);

const paperBag = new Item(
  "paper bag",
  "It's a brown paper bag filled with what looks like small biscuits, the size of peas.",
  true,
  1
);
paperBag.addAliases("brown bag");
paperBag.hidesItems = biscuits;
paperBag.verbs.give.test = (helper, item, other) => other.aliases.includes("cat");
paperBag.addAction("give", () => catGraph.commence("giveTreats"), false, true);
biscuits.addVerb(paperBag.verbs.take); // "take biscuits" should take the bag.
biscuits.addVerb(paperBag.verbs.put); // "put biscuits" should put the bag.
biscuits.addVerb(paperBag.verbs.give); // "give biscuits" should give the bag.

const keepsakeBox = new Container(
  "keepsake box",
  ["jewellery"],
  () => {
    if (keepsakeBox.solidity === 1) {
      return "The box is visible more as an impression or a shadow. If you look directly at it you can barely see it at all, but squint or turn your head to look at it from the corner of your eye and you can definitely make out that *something* is there. It's like the reflection of a reflection glimpsed in a window's glass.";
    } else if (keepsakeBox.solidity === 2) {
      return "It's much easier to see now, though it's still translucent. Looking at it reminds you of that effect when you close one eye and try to touch the tips of the index fingers of each hand, struggling against the lack of depth perception. It lacks a certain solidity, or corporeality, like it's an illusion or a trick played with mirrors. Which, upon reflection, you suppose it is. A reflection made material.";
    } else if (keepsakeBox.solidity >= 3) {
      return "It's completely solid now, giving no hint that it apparently materialised from thin air. It's a walnut keepsake box with a delicately engraved scene of a forest at night, complete with crescent moon, owl and cat. The corners are rounded and the two parts are connected with a pair of brass hinges. It's currently closed.";
    }
  },
  "The box lies open, its lid hinged back, revealing a rectangular compartment inside.",
  1,
  "in",
  true,
  false,
  true,
  1
);

keepsakeBox.hidesItems = paperBag;
keepsakeBox.locked = true;
keepsakeBox.addVerb(examine);
keepsakeBox.openText =
  "You open the lid of the box with no resistance at all. It smoothly folds back on its hinges and comes to a stop at a little before 180 degrees from its starting point.";
keepsakeBox.lockedText = () => {
  if (keepsakeBox.solidity >= 3) {
    return "The lid won't budge, though you can't see what's holding it closed. Magic, you wonder?";
  } else {
    return "When you reach out to touch the box, your fingers seem to pass straight through it, as though it's nothing but a mirage.";
  }
};

keepsakeBox.addTest("take", () => keepsakeBox.solidity >= 3);
keepsakeBox.addAction(
  "take",
  "You half expect it to disappear or slip through your fingers as you reach for it, but it does neither. It feels sturdy and real, like a perfectly normal box."
);
keepsakeBox.addAction(
  "take",
  () => {
    const inventory = selectInventory();
    if (
      keepsakeBox.container.itemsVisibleFromSelf &&
      keepsakeBox.container !== inventory &&
      (inventory.capacity === -1 || keepsakeBox.size <= inventory.free)
    ) {
      return "You try to pick it up but when you lean forward to do so your hand grasps at nothing but thin air. It's like trying to touch your index fingers together with one eye closed, or like the vain attempts of a cat to pounce on the patterns created by sunlight streaming through a glass bauble.";
    }
  },
  true,
  true
);

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

keepsakeBox.addVerb(
  new Verb("unlock", false, null, () => {
    if (keepsakeBox.locked) {
      return "You can't see how to unlock it. There's no keyhole and no obvious clasp holding it shut. Must be some kind of magical charm.";
    } else {
      return "The keepsake box is already unlocked.";
    }
  })
);

// Ensure the box locks when you close it.
keepsakeBox.addAction("close", () => (keepsakeBox.locked = true));
keepsakeBox.addPostscript("close", "The box emits a quiet **click**. It's locked again.");

memoCard.addVerb(examine);
mirrorEffects.add(memoCard, mirror, true, [
  () => {
    if (!selectPlayer().items["WOAIM"]) {
      selectPlayer().addItem(
        new MagicWord(
          "WOAIM",
          null,
          'You try your best to say "WOAIM". You\'re not sure whether you pronounced it correctly.',
          () => {}
        )
      );
    }
  },
  `Your heart skips a beat. When you look at the card in the enchanted mirror, a word appears in block capitals:
  ## WOAIM`
]);

const keepsakeBoxTimer = new Schedule.Builder()
  .addEvent(() => {
    keepsakeBox.locked = false;
    return "There's an audible **click** from somewhere nearby.";
  })
  .withDelay(0, TIMEOUT_TURNS)
  .addEvent(() => {
    if (!keepsakeBox.open && !keepsakeBox.locked) {
      keepsakeBox.locked = true;
      if (inSameRoomAs(keepsakeBox)) {
        return "There's another **click** from somewhere close. This one has a slightly different timbre to the first.";
      }
    }
  })
  .withDelay(20000, TIMEOUT_MILLIS)
  .recurring()
  .build();

const miaowResults = new SequentialText(
  '"Miiaaoow," you say, doing your very best cat impression. You fight the urge to shake your tail. Wait...you don\'t have a tail.',
  'Making your voice is high-pitched and catlike as you possibly can, you let out an extremely convincing "Miiaaoow!" It\'s all you can do to keep yourself from purring afterwards.',
  '"Miaow!" you protest. "Miaow, miaow, miaow!" That ought to get the message across.'
);

// Add miaow (almost) immediately so you can say it from the off.
setTimeout(() =>
  selectPlayer().addItem(
    new MagicWord(
      "MIAOW",
      ["miow", "miao"],
      miaowResults,
      () => {
        if (inSameRoomAs(keepsakeBox) && keepsakeBox.solidity >= 3) {
          keepsakeBoxTimer.commence();
        }
      },
      false
    )
  )
);

bedroom.addItems(bedsideTable, dresser, mirror);
