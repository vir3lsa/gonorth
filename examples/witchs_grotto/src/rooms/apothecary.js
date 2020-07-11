import {
  Room,
  Item,
  Verb,
  OptionGraph,
  selectRoom,
  selectPlayer,
  Event,
  TIMEOUT_TURNS,
  addEvent,
  CyclicText,
  SequentialText,
  Door,
  Schedule
} from "../../../../lib/gonorth";
import { Ingredient } from "../magic/ingredient";
import {
  Procedure,
  STEP_WATER,
  STEP_INGREDIENTS,
  STEP_HEAT,
  Potion,
  STEP_STIR,
  STEP_BLOOD,
  STEP_FAT,
  alchemy
} from "../magic/alchemy";
import { potionEffects, DRINK } from "../magic/potionEffects";
import { lowerSpiral } from "./lowerSpiral";
import { pestleAndMortar } from "../magic/pestleAndMortar";
import { cauldron, contents, tap, fire } from "../magic/cauldron";

export const apothecary = new Room(
  "Apothecary",
  "You seem to be in some kind of apothecary or decoction room. There's an enormous open fireplace mostly filled by a large black cauldron. Above it there's an arrangement of pipes that looks as though it's used to fill the cauldron with liquid.\n\nOne wall of the room is lined with shelf upon shelf of vials, jars and bottles. Most but not all have dusty labels with incomprehensible things scrawled on them. Another wall is hidden behind rows and rows of leather-bound books.\n\nOn the cold flagstones under foot there's a pentagram smeared in something brown and old-looking. Behind that there's a wooden bureau strewn with yellowing bits of paper.\n\nThere's an iron gate to the east."
);

const bureau = new Item(
  "bureau",
  "It's a beautiful oak writing desk lacquered with a rich, dark varnish. There are wide drawers beneath the worktop."
);
bureau.addAliases("desk");
bureau.itemsCanBeSeen = false;
bureau.capacity = 10;
bureau.preposition = "on";

const drawers = new Item(
  "drawers",
  "There are three drawers in total, stacked beneath the desk's writing surface, to the right of where one would sit. Each is fitted with an ornate bronze handle."
);
drawers.addAliases("drawer");
drawers.addVerb(
  new Verb(
    "open",
    () => drawers.exposed,
    () => drawers.getFullDescription(),
    "You tug on each of the drawer handles in turn but they don't budge - they're locked or perhaps just stuck."
  )
);
drawers.capacity = 5;

bureau.hidesItems = [drawers, pestleAndMortar];

const grimoire = new Item(
  "grimoire",
  "It's a sturdy tome bound in wrinkly black leather. The word *Grimoire* adorns the front and spine, embossed and finished with decorative gold leaf. There are no other markings. It looks like it holds *secrets*.",
  true,
  1
);
grimoire.roomListing =
  "One in particular catches your eye, however, emblazened in gold leaf with the word *Grimoire*.";
grimoire.addAliases("book");

const stopReading = {
  actions: "You close the grimoire."
};

const mendingPage = {
  id: "mending",
  actions:
    "## Elixir of Mending\n\nGot something that's broken or smashed into bits? One drop of this potion, it's instantly fixed!\n\n### Ingredients\n\n* 3 dryad toenails\n* 1 handful of alfalfa leaves\n* 1 bundle white sage\n\n### Process\n\n* Start with a water base (a full pot)\n* Add the ingredients\n* Gently heat and stir until the mixture turns purple",
  options: {
    "Next page": "woodworm",
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
    "Next page": "invisibility",
    "Previous page": "mending",
    "Stop reading": stopReading
  }
};

const invisibilityPage = {
  id: "invisibility",
  actions:
    "## Auto-Refractive Tincture\n\nWant to be sneaky or cause a real fright? This marvellous tincture will hide you from sight.\n\n### Ingredients\n\n* A sample of foamed oak\n* A cup of burdock root\n* A sprinkling of devil's claw\n* A thimble of newt eyes\n\n### Process\n\n* Work from a basis of animal fat\n* Add the foamed oak and bring the mixture to the boil\n* Add the burdock root and the devil's claw and remove the heat\n* Utter an incantation of binding\n* Finally, add the newt eyes",
  options: {
    "Next page": "strength",
    "Previous page": "woodworm",
    "Stop reading": stopReading
  }
};

const strengthPage = {
  id: "strength",
  actions: `## Elixir of Might\n\nIf bullies and monsters are threatening you, And all that you've tried is wrong, Then brew this elixir I'm begging of you, You'll be so incredibly strong!
    
Ingredients      | Process
:----------------|:-----------------------------------------------------------------------
Fat              | Half fill the pot with equal parts fat and blood
Blood            | Add the adder venom and bring the mixture to the boil
Astragalus       | Add the astragalus and stir until the brew turns the colour of amethyst
Valerian         | Add the valerian and keep stirring until gold flecks appear
Adder venom      |`,
  options: {
    "Next page": "sleep",
    "Previous page": "invisibility",
    "Stop reading": stopReading
  }
};

const sleepPage = {
  id: "sleep",
  actions:
    "## Sleeping Draught\n\nIf you're tired and grumpy and up all the night, just sip on this brew, you'll be out like a light.\n\n### Ingredients\n\n* A pinch of mandrake root, powdered\n* A handful of sage - your choice of colour\n* half a pint of slug mucus\n\nProcess\n\n* One\n* Two\n* Three",
  options: {
    "Next page": "catseye",
    "Previous page": "strength",
    "Stop reading": stopReading
  }
};

const catseyePage = {
  id: "catseye",
  actions:
    "## Feline Sight\n\nPlaceholder rhyme\n\n### Ingredients\n\n* 1 clump of a black cat's fur",
  options: {
    "Previous page": "sleep",
    "Stop reading": stopReading
  }
};

const readGrimoire = new OptionGraph(
  mendingPage,
  woodwormPage,
  invisibilityPage,
  strengthPage,
  sleepPage,
  catseyePage
);

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
bookShelf.addAliases("library", "books", "bookshelf");
bookShelf.hidesItems = grimoire;
bookShelf.itemsCanBeSeen = false;
bookShelf.preposition = "on";

const apparatus = new Item(
  "filling apparatus",
  "There's a spout above the cauldron from which a variety of fluids can be emitted. It's connected to a pipe that creeps around the corners of the fireplace and the apothecary itself before splitting off into three separate tubes. At the point the pipes converge there's a rotating dial with a marker that can be pointed at each of the inlets. There's a master valve just below the dial to control the flow of liquid."
);
apparatus.addAliases("pipes");

const masterValve = new Item(
  "valve",
  () =>
    `A black crank wheel that controls the flow from the three smaller pipes into the cauldron. It's currently ${
      masterValve.open ? "open" : "closed"
    }.`
);
masterValve.addAliases("crank");
masterValve.open = false;

const dial = new Item(
  "dial",
  "It's a bronze dial that can be rotated by hand. There's an arrow engraved in the circular top plate that can be made to point at any of the three inlet pipes."
);
dial.liquid = "water";

dial.addVerb(
  new Verb(
    "turn",
    true,
    [
      () => {
        dial.liquid === "water"
          ? (dial.liquid = "fat")
          : dial.liquid === "fat"
          ? (dial.liquid = "blood")
          : (dial.liquid = "water");
      },
      () => `You turn the dial to point at the ${dial.liquid} inlet pipe.`
    ],
    x => x,
    ["rotate", "spin", "switch"]
  )
);

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
      () =>
        `You spin the valve wheel back in the other direction to shut off the flow. Sure enough, the sound of rushing liquid ceases and the flow of ${
          dial.liquid
        } into the cauldron trickles to a stop.`
    ],
    "The valve is already closed."
  )
);

apparatus.hidesItems = [dial, masterValve];

const herbarium = new Item(
  "herbarium",
  "This must be the witch's herbarium. You have to admit it's an impressive sight. Multiple shelves line the walls, every inch filled with dusty glass jars, racks of vials, and stoppered bottles. They're all meticulously labelled with swirly handwritten names on paper sleeves, but many of them are indecipherable. You take a mental note of the ones you understand."
);

const adderVenom = new Ingredient(
  "Adder venom",
  "A stoppered bottle of slightly cloudy snake venom."
);

const alfalfa = new Ingredient("Alfalfa", "A jar of dried alfalfa leaves.");

const astragalus = new Ingredient(
  "Astragalus",
  "A bottle of astragalus root shavings."
);

const bladderwrack = new Ingredient("Bladderwrack", "placeholder");

const blueSage = new Ingredient("Blue Sage", "placeholder");

const burdockRoot = new Ingredient("Burdock Root", "placeholder");

const calendula = new Ingredient("Calendula", "placeholder");

const cockroachSaliva = new Ingredient(
  "Cockroach Saliva",
  "A vial of cockroach saliva. The substance is a pale yellow colour."
);

const dandelion = new Ingredient("Dandelion", "placeholder");

const devilsClaw = new Ingredient("Devil's Claw", "placeholder");

const dryadToenails = new Ingredient("Dryad Toenails", "placeholder");

const feverfew = new Ingredient("Feverfew", "placeholder");

const hibiscus = new Ingredient("Hibiscus", "placeholder");

const horehound = new Ingredient("Horehound", "placeholder");

const mandrakeRoot = new Ingredient("Mandrake Root", "placeholder");

const mugwort = new Ingredient("Mugwort", "placeholder");

const slugMucus = new Ingredient("Slug Mucus", "placeholder");

const valerian = new Ingredient("Valerian", "placeholder");

const vervain = new Ingredient("Vervain", "placeholder");

const whiteSage = new Ingredient("White Sage", "placeholder");

const witchHazel = new Ingredient("Witch Hazel", "placeholder");

const wormwood = new Ingredient("Wormwood", "placeholder");

herbarium.capacity = 20;
herbarium.addAliases("vials", "jars", "bottles", "ingredients");
herbarium.hidesItems = [
  adderVenom,
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

const mendingPotion = new Potion(
  "Elixir of Mending",
  "The substance inside the bottle is deep purple in colour, with flecks of gold that catch the light as you examine it."
);

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
  mendingPotion
);

const woodwormPotion = new Potion(
  "Organic Dissolution Accelerator",
  "It's thick, bright green and has a powerful chemical odour."
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
          "It falls into the water creating a dirty brown mixture."
        ),
        short: new CyclicText("no potion just yet", "a dirty brown colour")
      },
      {
        type: STEP_STIR,
        value: 3,
        text: new CyclicText(
          "As you stir the ingredients mix together and begin to react.",
          "Stirring is becoming more and more difficult as the mixture thickens, taking on a gloopy consistency.",
          "Gradually, the potion has been turning red before your eyes. It's now a deep crimson colour."
        ),
        short: new CyclicText(
          "beginning to react, but it's still just a brown sludge",
          "brown, thick and gloopy",
          "thick and gloopy and deep crimson in colour"
        )
      },
      {
        type: STEP_INGREDIENTS,
        value: [wormwood],
        text:
          "As the leaves drop into the ruddy mixture it suddenly shifts through shades of orange and yellow before finally settling on a luminous green. There's a strong smell to accompany the change and tendrils of steam are rising from the surface.",
        short: "luminous green with a chemical smell"
      }
    ]
  },
  woodwormPotion
);

const strengthPotion = new Potion(
  "Elixir of Might",
  "It's a deep purple colour, flecked with gold."
);
strengthPotion.addAliases("strength");

const strengthProcedure = new Procedure(
  {
    ordered: true,
    steps: [
      {
        ordered: false,
        steps: [
          { type: STEP_BLOOD, value: 0.25 },
          { type: STEP_FAT, value: 0.25 }
        ]
      },
      {
        ordered: false,
        steps: [
          {
            type: STEP_INGREDIENTS,
            value: [adderVenom],
            text:
              "The venom immediately splits the mixture, turning it into a slimy mess of reds and yellows.",
            short: "split, with slimy reds and yellows"
          },
          { type: STEP_HEAT, value: 10, leniency: 4 }
        ]
      },
      {
        type: STEP_INGREDIENTS,
        value: [astragalus],
        text:
          "As the astragalus hits the boiling liquid, a cloud of blue smoke billows from the surface.",
        short: "billowing blue smoke"
      },
      { type: STEP_HEAT, value: 1, leniency: 4 },
      {
        ordered: false,
        steps: [
          {
            type: STEP_STIR,
            value: 2,
            text: new CyclicText(
              "The mixture is no longer split, but instead has taken on a smooth, silky texture and is orange in hue.",
              "The stirring and the heat are causing changes to the concoction. It's darkened to a deep purple."
            ),
            short: new CyclicText(
              "smooth, silky and orange",
              "smooth, silky and purple"
            ),
            leniency: 1
          },
          { type: STEP_HEAT, value: 2, leniency: 4 }
        ]
      },
      {
        type: STEP_INGREDIENTS,
        value: [valerian],
        text: "A sweet smell emanates from the cauldron.",
        short: "smooth, silky, and purple, with a sweet scent."
      },
      { type: STEP_HEAT, value: 1, leniency: 4 },
      {
        ordered: false,
        steps: [
          {
            type: STEP_STIR,
            value: 3,
            text: new CyclicText(
              "The mixture barely looks wet now - it's more like an extremely malleable plastic, but still somehow liquid.",
              "The purple colour is even deeper, like an alien sky at night.",
              "Tiny flecks of gold have appeared amongst the purple, catching the light as you stir."
            ),
            short: new CyclicText(
              "smooth and plastic-like",
              "deep alien purple",
              "purple with flecks of gold"
            ),
            leniency: 1
          },
          { type: STEP_HEAT, value: 3, leniency: 10 }
        ]
      }
    ]
  },
  strengthPotion
);

const matchbook = new Item(
  "matchbook",
  "It's an old-fashioned matchbook containing several long matches. There's a picture of a phoenix on the cover.",
  true,
  0.5
);
matchbook.addAliases("matches", "match");
matchbook.preposition = "with";

const tornPage = new Item(
  "torn page",
  new SequentialText(
    `A page torn roughly from a book. You can see the end of a sentence you can't make sense of, and then something that looks interesting:

## Essence of Moon

Start with a mixture of two parts fat to one part water.  
Add a single moonstone.  
Recite the Lunar Incantation.`,
    "Scibbled in the margin are the words of the Lunar Incantation. You commit them to memory."
  )
);
tornPage.addAliases("paper");

alchemy.addProcedures(mendingProcedure, woodwormProcedure, strengthProcedure);

potionEffects.add(
  woodwormPotion,
  bureau,
  true,
  () => {
    bureau.description =
      "The right-hand side of the bureau has been almost completely eaten away by the dissolution potion. Foamy residue still drips from the carcass-like remains as the nearly-spent reagent works the last of its effects. There's a huge wound-like hole in the top of the desk, exposing the contents of the drawers beaneath.";
    drawers.description =
      "The drawers still don't open but now that the desk top is almost completely gone, you can see clearly inside the top drawer.";
    drawers.exposed = true;
    drawers.addItems(matchbook, tornPage);
  },
  "You carefully pour a droplet of the Organic Dissolution Accelerator onto the surface of the desk. Immediately it starts foaming and producing white steam. When it finishes hissing and bubbling, there's a depression the size of a grape in the heavy oak worktop.",
  "You tip the entire contents of the vial onto the bureau, watching in horror and delight as the ferocious substance devours the wood, eating its way right through to the drawers beneath. By the time the potion has done its work, the top of the desk is almost entirely gone and the once-locked drawers are easily accessible."
);

potionEffects.add(
  strengthPotion,
  DRINK,
  true,
  () => (selectPlayer().strong = true),
  "You lift the sweet-smelling elixir to your lips and take a tentative sip. You feel vaguely invigorated as the potion slips down your throat. Feeling suddenly confident, you glug down the rest of the potion from the vial. For a moment nothing happens.",
  "Then, suddenly, you begin to feel *powerful*. Your shirt starts to feel extremely tight as your muscles swell and bulge. You've never felt so strong. You are *ripped*."
);

export const strengthTimer = new Schedule.Builder()
  .withCondition(() => selectPlayer().strong)
  .addEvent(
    "You're feeling a little less...buff...than before. The strength potion's starting to wear off."
  )
  .withDelay(10, TIMEOUT_TURNS)
  .addEvent(
    () => (selectPlayer().strong = false),
    "Sure enough, the potion's worn off. You're back to your normal skinny self."
  )
  .withDelay(3, TIMEOUT_TURNS)
  .recurring()
  .build();

export const ironGate = new Door(
  "gate",
  () => {
    if (ironGate.broken) {
      return "The broken gate is leaning against the wall where you left it, after ripping it from its hinges.";
    } else {
      return `The wrought iron gate stands between you and ${
        selectRoom().name === "Apothecary"
          ? "a sharply curving corridor"
          : "a cluttered-looking room"
      } beyond. It's locked with a rusty padlock and is attached to the wall by two rusty hinges. All of these look like they could fail imminently.`;
    }
  },
  false,
  true
);

const hinges = new Item("hinges", () => {
  if (ironGate.broken) {
    return "The hinges have snapped right through, parts of them still attached to the stone wall.";
  } else {
    return "The hinges are are a mess of red rust and have almost completely worn through. They look very weak.";
  }
});
hinges.addAliases("hinge");

const padlock = new Item("padlock", () => {
  if (ironGate.broken) {
    return "The rusty padlock snapped under the immense pressure you put on it. Its mangled remains lie on the floor.";
  } else {
    return "The padlock has certainly seen better days. There's no part of it that isn't covered in rust.";
  }
});
padlock.addAliases("lock");

ironGate.verbs.examine.onSuccess.insertAction(
  () => {
    if (!lowerSpiral.items["padlock"]) {
      lowerSpiral.addItems(padlock, hinges);
    }
  } // Add hidden items to adjacent room too
);

ironGate.hidesItems = [hinges, padlock];

const breakVerb = new Verb(
  "break",
  () => selectPlayer().strong && !ironGate.broken,
  [
    () => (ironGate.broken = true),
    "Flexing your bulging muscles, you grab hold of the iron bars of the gate and pull with all your might. It turns out all your might wasn't required as the padlock and hinges snap easily under the force of your exaggerated strength and you topple backwards, landing clumsily with the gate on top of you.",
    "You get up, dust yourself off, and lean the liberated gate against the wall."
  ],
  () => {
    if (ironGate.broken) {
      return "The gate's already broken! You ripped it from its hinges, remember?";
    } else {
      return "You grab hold of the iron bars of the gate and pull with all your might. Unfortunately, it's not enough. The padlock and hinges both hold firm. If only you weren't quite such a weakling.";
    }
  },
  ["pull", "snap", "destroy", "smash", "kick"]
);

ironGate.addVerb(breakVerb);
padlock.addVerb(breakVerb);
hinges.addVerb(breakVerb);

// Have to add gate to adjacent room here to avoid circular dependencies
lowerSpiral.addItem(ironGate);

apothecary.addItems(
  bookShelf,
  herbarium,
  cauldron,
  contents,
  apparatus,
  tap,
  fire,
  bureau,
  ironGate,
  strengthPotion
);

apothecary.setEast(
  lowerSpiral,
  () => ironGate.broken,
  "Glancing at the evidence of your physical might leaning against the wall you step casually through the gateway.",
  "The gate is locked with a large, albeit rusty, padlock."
);
