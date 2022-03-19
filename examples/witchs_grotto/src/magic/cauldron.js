import {
  Item,
  Verb,
  OptionGraph,
  selectInventory,
  RandomText,
  newVerb,
  addEvent,
  TIMEOUT_TURNS,
  Event
} from "../../../../lib/gonorth";
import { Ingredient } from "./ingredient";
import { Alchemy } from "./alchemy";
import { pentagram } from "./pentagram";

// Our alchemy instance for the apothecary
export const alchemy = new Alchemy(pentagram);

let describeCauldronContents;

export const cauldron = new Item("cauldron", () => {
  const basic =
    "A large cast-iron pot that fills the fireplace. It stands on three stubby legs and has space beneath it to light a fire - the space is already occupied by a few sturdy logs and some smaller kindling. There's also a metal cover that can be pulled over to extinguish the fire. At the bottom of the cauldron there's a tap to let the contents drain away into a stone channel in the floor that runs down one side of the room and disappears through the wall. There's apparatus above the cauldron for filling it with a range of liquids.";

  const detail = describeCauldronContents();

  if (detail) {
    return `${basic}\n\n${detail}`;
  }

  return basic;
});
cauldron.addAliases("pot", "container");

describeCauldronContents = () => {
  const ingredientsAdded = Object.values(cauldron.items).find(itemsWithName =>
    itemsWithName.find(item => item instanceof Ingredient)
  );

  const baseAdded =
    alchemy.waterLevel > 0 || alchemy.fatLevel > 0 || alchemy.bloodLevel > 0;

  if (alchemy.shortDescription) {
    return `The concoction within the cauldron is ${alchemy.shortDescription}.`;
  } else if (ingredientsAdded && baseAdded) {
    return `There's some kind of potion inside the cauldron.`;
  } else if (ingredientsAdded) {
    return `There are ingredients inside the cauldron.`;
  } else if (baseAdded) {
    return `There's some kind of liquid inside the cauldron.`;
  } else if (!cauldron.basicItemList.length) {
    return `There's currently nothing inside the cauldron.`;
  }
};

cauldron.capacity = 100;

export const contents = new Item("cauldron contents", () =>
  describeCauldronContents()
);
contents.aliases = ["contents", "potion", "liquid"];
contents.addVerb(
  new Verb(
    "take",
    () => {
      const inventory = selectInventory();
      return (
        alchemy.potion &&
        (inventory.capacity === -1 || inventory.free > 0) &&
        !inventory.items[alchemy.potion.name.toLowerCase()]
      );
    },
    [
      () => selectInventory().addItem(alchemy.potion),
      () =>
        `You grab an empty vial from the shelf and carefully fill it with ${
          alchemy.potion.name
        }.`
    ],
    () =>
      alchemy.potion
        ? selectInventory().items[alchemy.potion.name.toLowerCase()]
          ? `You already have ${alchemy.potion.name}.`
          : "You don't have room to carry the potion."
        : "There's no finished potion to take yet."
  )
);

const ladle = new Item(
  "ladle",
  "The handle is almost as long as you are tall. It loops over at the end so it can be hung on the metal bar that crosses the cauldron. At the other end there's a deeply capacious spoon that will do equally well for stirring and dispensing.",
  true,
  7
);
ladle.addAliases("spoon");

ladle.containerListing =
  "Hanging on a metal bar that extends from one side of the iron pot and loops over it to rejoin the other side is a heavy-duty ladle used for stirring and spooning out the contents.";
ladle.preposition = "with";

const stirText = new RandomText(
  "You use all your strength to pull the heavy ladle through the contents of the cauldron.",
  "You stir the ingredients in the pot, grunting with the exertion.",
  "You mix the ingredients with a few good rotations of the ladle."
);

const stopStirringText = new RandomText(
  "Being careful not to splash any of the brew, you rest the ladle beside the pot.",
  "You withdraw the ladle and put it down.",
  "You put the ladle, still dripping, on the floor."
);

const stirNodes = [
  {
    id: "stir",
    actions: [[stirText, () => alchemy.stir()]],
    options: {
      "Keep stirring": "stir",
      "Stop stirring": "stop"
    }
  },
  {
    id: "stop",
    noEndTurn: true,
    actions: stopStirringText
  }
];

const stirGraph = new OptionGraph("stir", ...stirNodes);

const stir = new Verb(
  "stir",
  (helper, item, other) => other === ladle,
  stirGraph.commence(),
  "That won't be any good for stirring.",
  ["mix"],
  false,
  cauldron
);

stir.makePrepositional("with what");

cauldron.addVerb(stir);
cauldron.addItem(ladle);
contents.addVerb(stir);

export const tap = new Item(
  "tap",
  "A tap at the bottom of the cauldron used to empty it of its contents. It opens into a stone channel that carries the waste liquid out of the room through a dark tunnel in the wall."
);

tap.addVerb(
  new Verb(
    "open",
    () => alchemy.liquidLevel > 0,
    [
      () => alchemy.flush(),
      // Deliberately copy the uniqueItems list before iterating over it
      () =>
        [...cauldron.uniqueItems].forEach(item => {
          if (item instanceof Ingredient) {
            cauldron.removeItem(item);
          }
        }),
      "You spin the wheel that opens the tap and watch as the cauldron's contents come gushing and gurgling out into the drainage channel. You jump back quickly to avoid getting your shoes splashed. Once the vessel is empty, you twist the tap back to the closed position."
    ],
    "There's no liquid in the cauldron, so it can't be drained.",
    ["flush", "drain", "empty"]
  )
);

cauldron.addVerb(tap.verbs.open);

const unlitDesc =
  "There's a small stack of logs beneath the cauldron that will do very nicely as fuel for a fire. If only you had something to light one with.";

export const fire = new Item("fire", unlitDesc);
fire.aliases = ["space", "logs", "kindling"];

const ignite = newVerb({
  name: "light",
  test: () => !fire.lit,
  onSuccess: [
    () => {
      fire.description =
        "A decent fire is crackling away beneath the pot, sending tongues of yellow flame licking against its underside.";
    },
    () => (fire.lit = true),
    "Striking one of the big matches against the rough paper, you carefully lower it towards the kindling as its small flame ignites. After a moment or two the kindling catches and begins to crackle as the flames quickly spread. Before too long the logs are smouldering and you can feel the heat radiating from the small blaze."
  ],
  onFailure: "The fire's already roaring.",
  aliases: ["ignite"],
  prepositional: true,
  interrogative: "with what"
});
const extinguish = newVerb({
  name: "extinguish",
  test: () => fire.lit,
  onSuccess: [
    () => {
      fire.description = unlitDesc;
    },
    () => (fire.lit = false),
    "You pull the metal cover over the fire to put it out. Satisfied, you return the cover to its normal position."
  ],
  onFailure: "The fire isn't lit.",
  aliases: ["put out"]
});
fire.addVerbs(ignite, extinguish);

const cover = new Item(
  "cover",
  "A metal cover that can be pulled over the fire to cut off its air supply and extinguish it. Fortunately, the handles are wooden."
);
cover.aliases = ["fire cover"];
cover.addVerb(
  newVerb({
    name: "close",
    test: () => fire.lit,
    onSuccess: [
      () => {
        fire.description = unlitDesc;
      },
      () => (fire.lit = false),
      "You pull the metal cover over the fire to put it out. Satisfied, you return the cover to its normal position."
    ],
    onFailure: "The fire isn't lit.",
    aliases: ["pull", "use"]
  })
);
cauldron.hidesItems = [cover];

addEvent(
  new Event(
    "heat cauldron",
    () => alchemy.addHeat(),
    () => fire.lit,
    0,
    TIMEOUT_TURNS,
    x => x,
    true
  )
);
