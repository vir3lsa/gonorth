import {
  Room,
  Item,
  Verb,
  OptionGraph,
  selectInventory,
  selectRoom,
  Event,
  TIMEOUT_TURNS,
  addEvent,
  RandomText,
  CyclicText
} from "../../../../lib/gonorth";
import { Ingredient } from "./ingredient";
import {
  Procedure,
  Alchemy,
  STEP_WATER,
  STEP_INGREDIENTS,
  STEP_HEAT,
  Potion,
  STEP_STIR
} from "./alchemy";

export const apothecary = new Room(
  "apothecary",
  "You seem to be in some kind of apothecary or decoction room. There's an enormous open fireplace mostly filled by a large black cauldron. Above it there's an arrangement of pipes that looks as though it's used to fill the cauldron with liquid.\n\nOne wall of the room is lined with shelf upon shelf of vials, jars and bottles. Most but not all have dusty labels with incomprehensible things scrawled on them. Another wall is hidden behind rows and rows of leather-bound books.\n\nOn the cold flagstones under foot there's a pentagram smeared in something brown and old-looking. Behind that there's a wooden bureau strewn with yellowing bits of paper.\n\nThere's a red door to the west."
);

const alchemy = new Alchemy();

const grimoire = new Item(
  "grimoire",
  "It's a sturdy tome bound in wrinkly black leather. The word *Grimoire* adorns the front and spine, embossed and finished with decorative gold leaf. There are no other markings. It looks like it holds *secrets*.",
  true,
  1
);
grimoire.roomListing =
  "One in particular catches your eye, however, emblazened in gold leaf with the word *Grimoire*.";
grimoire.aliases = ["book"];

const stopReading = {
  actions: "You close the grimoire."
};

const mendingPage = {
  id: "mending",
  actions:
    "## Elixir of Mending\n\nGot something that's broken or smashed into bits? One drop of this potion, it's instantly fixed!\n\n### Ingredients\n\n* 3 dryad toenails\n* 1 handful of alfalfa leaves\n* 1 bundle white sage\n\n### Process\n\n* Start with a water base (a full pot)\n* Add the ingredients\n* Gently heat and stir until the mixture turns purple",
  options: {
    "Stop reading": stopReading
  }
};

const woodwormPage = {
  id: "woodworm",
  actions: `## Organic Dissolution Accelerator\n\nTrees and wood and flesh and bone, turn to soup and slush and foam.

Ingredients      | Process
:----------------|:------------------------------------------
Cockroach saliva | Half fill the pot with cold water
Wormwood         | Add the cockroach saliva and the horehound
Horehound        | Stir until the colour changes
|                | Add the wormwood`,
  options: {
    "Stop reading": stopReading
  }
};

const invisibilityPage = {
  id: "invisibility",
  actions:
    "## Auto-Refractive Tincture\n\nWant to be sneaky or cause a real fright? This marvellous tincture will hide you from sight.\n\n### Ingredients\n\n* A sample of foamed oak\n* A cup of burdock root\n* A sprinkling of devil's claw\n* A thimble of newt eyes\n\n### Process\n\n* Work from a basis of animal fat\n* Add the foamed oak and bring the mixture to the boil\n* Add the burdock root and the devil's claw and remove the heat\n* Utter an incantation of binding\n* Finally, add the newt eyes",
  options: {
    "Stop reading": stopReading
  }
};

const strengthPage = {
  id: "strength",
  actions: "placeholder",
  options: {
    "Stop reading": stopReading
  }
};

const sleepPage = {
  id: "sleep",
  actions:
    "## Sleeping Draught\n\nIf you're tired and grumpy and up all the night, just sip on this brew, you'll be out like a light.\n\n### Ingredients\n\n* A pinch of mandrake root, powdered\n* A handful of sage - your choice of colour\n* half a pint of slug mucus\n\nProcess\n\n* One\n* Two\n* Three",
  options: {
    "Stop reading": stopReading
  }
};

const catseyePage = {
  id: "catseye",
  actions:
    "## Feline Sight\n\nPlaceholder rhyme\n\n### Ingredients\n\n* 1 clump of a black cat's fur",
  options: {
    "Stop reading": stopReading
  }
};

mendingPage.options["Next page"] = woodwormPage;
woodwormPage.options["Next page"] = invisibilityPage;
invisibilityPage.options["Next page"] = strengthPage;
strengthPage.options["Next page"] = sleepPage;
sleepPage.options["Next page"] = catseyePage;

catseyePage.options["Previous page"] = sleepPage;
sleepPage.options["Previous page"] = strengthPage;
strengthPage.options["Previous page"] = invisibilityPage;
invisibilityPage.options["Previous page"] = woodwormPage;
woodwormPage.options["Previous page"] = mendingPage;

const readGrimoire = new OptionGraph(mendingPage);

grimoire.addVerb(
  new Verb(
    "read",
    true,
    [
      "You carefully open the dusty tome, the spine creaking as you prise the yellowing pages apart. Scanning through the contents, most of it doesn't make any sense to you. You do understand the word *Potions*, though, so you flip to the corresponding page.",
      () => readGrimoire.commence()
    ],
    [],
    ["open"]
  )
);

const bookShelf = new Item(
  "book shelf",
  "The shelves are full of ancient leather-bound books in dark greens, reds and blues. Most of them have titles written in a language you can't even identify, much less read and understand."
);

bookShelf.capacity = 2;
bookShelf.aliases = ["library", "books", "bookshelf"];
bookShelf.hidesItems = grimoire;
bookShelf.itemsCanBeSeen = false;
bookShelf.preposition = "on";

const cauldron = new Item("cauldron", () => {
  const basic =
    "A large cast-iron pot that fills the fireplace. It stands on three stubby legs and has space beneath it to light a fire. There's a valve at the bottom to let the contents drain away into a stone channel in the floor that runs down one side of the room and disappears through the wall. There's apparatus above the cauldron for filling it with a range of liquids.";

  const ingredientsAdded = Object.values(cauldron.items).find(
    item => item instanceof Ingredient
  );
  const baseAdded =
    alchemy.waterLevel > 0 || alchemy.fatLevel > 0 || alchemy.bloodLevel > 0;

  if (ingredientsAdded && baseAdded) {
    return `${basic}\n\nThere's some kind of potion inside.`;
  } else if (ingredientsAdded) {
    return `${basic}\n\nThere are ingredients inside.`;
  } else if (baseAdded) {
    return `${basic}\n\nThere's some kind of liquid inside.`;
  } else if (!cauldron.items.length) {
    return `${basic}\n\nThere's currently nothing inside.`;
  }

  return basic;
});

cauldron.capacity = 100;
cauldron.itemsCanBeSeen = false;

const contents = new Item("contents", () => {
  // TODO Create dynamic description
  return "placeholder";
});
contents.aliases = ["potion", "liquid"];

const fire = new Item(
  "fire",
  "There's a small stack of logs beneath the cauldron that will do very nicely as fuel for a fire. If only you had something to light one with."
);
fire.aliases = ["space"];
fire.addVerb(new Verb("light", () => selectInventory().items["matches"]));

const ladle = new Item(
  "ladle",
  "The handle is almost as long as you are tall. It loops over at the end so it can be hung on the metal bar that crosses the cauldron. At the other end there's a deeply capacious spoon that will do equally well for stirring and dispensing.",
  true,
  7
);

ladle.roomListing =
  "Hanging on a metal bar that extends from one side of the iron pot and loops over it to rejoin the other side is a heavy-duty ladle used for stirring and spooning out the contents.";
ladle.preposition = "with";

const stir = new Verb(
  "stir",
  (helper, other) => other === ladle,
  [
    [
      new RandomText(
        "You use all your strength to pull the heavy ladle through the contents of the cauldron.",
        "You stir the ingredients in the pot, grunting with the exertion.",
        "You mix the ingredients with a few good rotations of the ladle."
      ),
      () => alchemy.stir()
    ]
  ],
  [],
  ["mix"]
);

stir.prepositional = true;

cauldron.addVerb(stir);
cauldron.addItem(ladle);

const apparatus = new Item(
  "filling apparatus",
  "There's a spout above the cauldron from which a variety of fluids can be emitted. It's connected to a pipe that creeps around the corners of the fireplace and the apothecary itself before splitting off into three separate tubes. At the point the pipes converge there's a rotating dial with a marker that can be pointed at each of the inlets. There's a master valve just below the dial to control the flow of liquid."
);
apparatus.aliases = ["apparatus", "pipes"];

const masterValve = new Item(
  "valve",
  () =>
    `A black crank wheel that controls the flow from the three smaller pipes into the cauldron. It's currently ${
      masterValve.open ? "open" : "closed"
    }.`
);
masterValve.aliases = ["crank"];
masterValve.open = false;

const dial = new Item(
  "dial",
  "It's a bronze dial that can be rotated by hand. There's an arrow engraved in the circular top plate that can be made to point at any of the three inlet pipes."
);
dial.liquid = "water";

const flow = new Event(
  () => {
    if (dial.liquid === "water") {
      return alchemy.addWater();
    } else if (dial.liquid === "fat") {
      return alchemy.addFat();
    } else if (dial.liquid === "blood") {
      return alchemy.addBlood();
    }
  },
  () => selectRoom() === apothecary && masterValve.open,
  0,
  TIMEOUT_TURNS,
  x => x,
  true
);

addEvent(flow);

masterValve.addVerbs(
  new Verb(
    "open",
    () => !masterValve.open,
    [
      () => (masterValve.open = true),
      "You grab the crank wheel with both hands and heave it in an anticlockwise direction. After yanking it around a few times you hear liquid start to flow through the pipe before splashing into the cauldron moments later."
    ],
    "The valve is already open as far as it'll go."
  ),
  new Verb(
    "close",
    () => masterValve.open,
    [
      () => (masterValve.open = false),
      `You spin the valve wheel back in the other direction to shut off the flow. Sure enough, the sound of rushing liquid ceases and the flow of ${dial.liquid} into the cauldron trickles to a stop.`
    ],
    "The valve is already closed."
  )
);

apparatus.hidesItems = [dial, masterValve];

const herbarium = new Item(
  "herbarium",
  "This must be the witch's herbarium. You have to admit it's an impressive sight. Multiple shelves line the walls, every inch filled with dusty glass jars, racks of vials, and stoppered bottles. They're all meticulously labelled with swirly handwritten names on paper sleeves, but many of them are indecipherable. You take a mental note of the ones you understand."
);

const alfalfa = new Ingredient(
  "Alfalfa",
  "A jar of dried alfalfa leaves.",
  cauldron,
  alchemy
);

const astragalus = new Ingredient(
  "Astragalus",
  "placeholder",
  cauldron,
  alchemy
);

const bladderwrack = new Ingredient(
  "Bladderwrack",
  "placeholder",
  cauldron,
  alchemy
);

const blueSage = new Ingredient("Blue Sage", "placeholder", cauldron, alchemy);

const burdockRoot = new Ingredient(
  "Burdock Root",
  "placeholder",
  cauldron,
  alchemy
);

const calendula = new Ingredient("Calendula", "placeholder", cauldron, alchemy);

const cockroachSaliva = new Ingredient(
  "Cockroach Saliva",
  "A vial of cockroach saliva. The substance is a pale yellow colour.",
  cauldron,
  alchemy
);

const dandelion = new Ingredient("Dandelion", "placeholder", cauldron, alchemy);

const devilsClaw = new Ingredient(
  "Devil's Claw",
  "placeholder",
  cauldron,
  alchemy
);

const dryadToenails = new Ingredient(
  "Dryad Toenails",
  "placeholder",
  cauldron,
  alchemy
);

const feverfew = new Ingredient("Feverfew", "placeholder", cauldron, alchemy);

const hibiscus = new Ingredient("hibiscus", "placeholder", cauldron, alchemy);

const horehound = new Ingredient("Horehound", "placeholder", cauldron, alchemy);

const mandrakeRoot = new Ingredient(
  "Mandrake Root",
  "placeholder",
  cauldron,
  alchemy
);

const mugwort = new Ingredient("Mugwort", "placeholder", cauldron, alchemy);

const slugMucus = new Ingredient(
  "Slug Mucus",
  "placeholder",
  cauldron,
  alchemy
);

const valerian = new Ingredient("Valerian", "placeholder", cauldron, alchemy);

const vervain = new Ingredient("Vervain", "placeholder", cauldron, alchemy);

const whiteSage = new Ingredient(
  "White Sage",
  "placeholder",
  cauldron,
  alchemy
);

const witchHazel = new Ingredient(
  "Witch Hazel",
  "placeholder",
  cauldron,
  alchemy
);

const wormwood = new Ingredient("Wormwood", "placeholder", cauldron, alchemy);

herbarium.capacity = 20;
herbarium.aliases = ["vials", "jars", "bottles", "ingredients"];
herbarium.hidesItems = [
  alfalfa,
  astragalus,
  bladderwrack,
  blueSage,
  burdockRoot,
  calendula,
  cockroachSaliva,
  dandelion,
  devilsClaw,
  dryadToenails,
  feverfew,
  hibiscus,
  horehound,
  mandrakeRoot,
  mugwort,
  slugMucus,
  valerian,
  vervain,
  whiteSage,
  witchHazel,
  wormwood
];
herbarium.itemsCanBeSeen = false;

const mendingProcedure = new Procedure(
  {
    ordered: true,
    steps: [
      {
        ordered: false,
        steps: [
          { type: STEP_WATER, value: 1 },
          { type: STEP_INGREDIENTS, value: [dryadToenails, alfalfa, whiteSage] }
        ]
      },
      { type: STEP_HEAT, value: 3 }
    ]
  },
  new Potion(
    "Elixir of Mending",
    "The substance inside the bottle is deep purple in colour, with flecks of gold that catch the light as you examine it."
  )
);

const woodwormProcedure = new Procedure(
  {
    ordered: true,
    steps: [
      { type: STEP_WATER, value: 0.5 },
      {
        type: STEP_INGREDIENTS,
        value: [cockroachSaliva, horehound],
        text: new CyclicText(
          "It quickly dissolves into the water.",
          "It falls into the water but needs to be mixed in."
        )
      },
      {
        type: STEP_STIR,
        value: 3,
        text: new CyclicText(
          "As you stir the mixture begins to turn brown.",
          "Stirring is becoming more and more difficult as the mixture thickens, taking on a gloopy consistency.",
          "Gradually, the potion has been turning red before your eyes. It's now a deep crimson colour."
        ),
        short: new CyclicText(
          "brown",
          "brown, thick and gloopy",
          "thick and gloopy and deep crimson in colour"
        )
      },
      {
        type: STEP_INGREDIENTS,
        value: [wormwood],
        text:
          "As the leaves drop into the ruddy mixture it suddenly shifts through shades of orange and yellow before finally setting on a luminous green. There's a strong smell to accompany the change and tendrils of steam are rising from the surface.",
        short: "luminous green with a chemical smell"
      }
    ]
  },
  new Potion(
    "Organic Dissolution Accelerator",
    "It's thick, bright green and has a powerful chemical odour."
  )
);

alchemy.addProcedures(mendingProcedure, woodwormProcedure);

apothecary.addItems(bookShelf, herbarium, cauldron, apparatus);
