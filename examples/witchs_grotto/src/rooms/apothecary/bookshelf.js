import {
  Item,
  Verb,
  OptionGraph,
  selectRoom
} from "../../../../../lib/gonorth";

const scrap = new Item(
  "scrap of paper",
  "It's a crumpled scrap of paper that's been torn from a book. A note is scrawled on it in loopy handywriting:\n\nInvoking spirit - place items on pentagram",
  true,
  1
);

const grimoire = new Item(
  "grimoire",
  "It's a sturdy tome bound in wrinkly black leather. The word *Grimoire* adorns the front and spine, embossed and finished with decorative gold leaf. There are no other markings. It looks like it holds *secrets*.",
  true,
  1
);
grimoire.containerListing =
  "One in particular catches your eye, however, emblazened in gold leaf with the word *Grimoire*.";
grimoire.addAliases("book");
grimoire.addItem(scrap);

const grimoireNodes = [
  {
    id: "mending",
    actions:
      "## Elixir of Mending\n\nGot something that's broken or smashed into bits? One drop of this potion, it's instantly fixed!\n\n### Ingredients\n\n* 3 dryad toenails\n* 1 handful of alfalfa leaves\n* 1 bundle white sage\n\n### Process\n\n* Start with a water base (a full pot)\n* Add the ingredients\n* Gently heat and stir until the mixture turns purple",
    options: {
      "Next page": "woodworm",
      "Stop reading": "stopReading"
    }
  },
  {
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
      "Stop reading": "stopReading"
    }
  },
  {
    id: "invisibility",
    actions:
      "## Auto-Refractive Tincture\n\nWant to be sneaky or cause a real fright? This marvellous tincture will hide you from sight.\n\n### Ingredients\n\n* A sample of foamed oak\n* A cup of burdock root\n* A sprinkling of devil's claw\n* A thimble of newt eyes\n\n### Process\n\n* Work from a basis of animal fat\n* Add the foamed oak and bring the mixture to the boil\n* Add the burdock root and the devil's claw and remove the heat\n* Utter an incantation of binding\n* Finally, add the newt eyes",
    options: {
      "Next page": "strength",
      "Previous page": "woodworm",
      "Stop reading": "stopReading"
    }
  },
  {
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
      "Stop reading": "stopReading"
    }
  },
  {
    id: "sleep",
    actions:
      "## Sleeping Draught\n\nIf you're tired and grumpy and up all the night, just sip on this brew, you'll be out like a light.\n\n### Ingredients\n\n* A pinch of mandrake root, powdered\n* A handful of sage - your choice of colour\n* half a pint of slug mucus\n\nProcess\n\n* One\n* Two\n* Three",
    options: {
      "Next page": "catseye",
      "Previous page": "strength",
      "Stop reading": "stopReading"
    }
  },
  {
    id: "catseye",
    actions:
      "## Feline Sight\n\nPlaceholder rhyme\n\n### Ingredients\n\n* 1 clump of a black cat's fur",
    options: {
      "Previous page": "sleep",
      "Stop reading": "stopReading"
    }
  },
  {
    id: "stopReading",
    actions: "You close the grimoire.",
    noEndTurn: true
  }
];

const readGrimoire = new OptionGraph(...grimoireNodes);

grimoire.addVerb(
  new Verb(
    "read",
    true,
    [
      "You carefully open the dusty tome, the spine creaking as you prise the yellowing pages apart. Scanning through the contents, most of it doesn't make any sense to you. You do understand the word *Potions*, though, so you flip to the corresponding page.",
      () => {
        if (grimoire.items["scrap"]) {
          grimoire.removeItem(scrap);
          selectRoom().addItem(scrap);
          return "As you do so, a scrap of yellowing paper falls from between the pages and flutters softly to the floor.";
        }
      },
      () => readGrimoire.commence()
    ],
    [],
    ["open"]
  )
);

const druidicPeoples = new Item(
  "Druidic Peoples and Their Customs",
  "A relatively slim book in a plain green cover that's faded with age, the corners somewhat worn down. 'Druidic Peoples and Their Customs' was evidently written by an E. M. Pondsmith, judging by the name embossed on the front in letters almost as large as those of the title itself.",
  true,
  1
);
druidicPeoples.containerListing =
  "Searching along the rows of books, you eventually spot the one you're looking for tucked between two much larger volumes. 'Druidic Peoples and Their Customs' peeks out at you, the words on the spine looking simultaneously familiar and strange to your eyes.";
druidicPeoples.addAliases("book, druid");
druidicPeoples.addVerb(
  new Verb(
    "read",
    true,
    [
      "You open the book and peer inside at the tiny text covering its pages. Squinting, you can certainly read the words, but the book uses such scholarly language you can make neither head nor tail of it."
    ],
    [],
    ["open"]
  )
);
druidicPeoples.article = "";
druidicPeoples.properNoun = true;

druidicPeoples.verbs.give.test = (helper, other) =>
  other.aliases.includes("cat");
druidicPeoples.verbs.give.onSuccess = [() => "Smashing, smashing, smashing!"];

const bookShelf = new Item(
  "book shelf",
  "The shelves are full of ancient leather-bound books in dark greens, reds and blues. Most of them have titles written in a language you can't even identify, much less read and understand."
);

bookShelf.capacity = 2;
bookShelf.addAliases("library", "books", "bookshelf");
bookShelf.hidesItems = [grimoire];
bookShelf.preposition = "on";

export { bookShelf, druidicPeoples };
