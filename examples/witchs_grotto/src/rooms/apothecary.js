import { Room, Item, Verb, OptionGraph } from "../../../../lib/gonorth";

export const apothecary = new Room(
  "apothecary",
  "You seem to be in some kind of apothecary or decoction room. There's an enormous open fireplace mostly filled by a large black cauldron. Above it there's an arrangement of pipes that looks as though it's used to fill the cauldron with liquid.\n\nOne wall of the room is lined with shelf upon shelf of vials, jars and bottles. Most but not all have dusty labels with incomprehensible things scrawled on them. Another wall is hidden behind rows and rows of leather-bound books.\n\nOn the cold flagstones under foot there's a pentagram smeared in something brown and old-looking. Behind that there's a wooden bureau strewn with yellowing bits of paper.\n\nThere's a red door to the west."
);

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

const readGrimoire = new OptionGraph({
  actions:
    "## Elixir of Mending\n\nGot something that's broken or smashed into bits?\nOne drop of this potion, it's instantly fixed!\n\n### Ingredients\n\n* One\n* Two\n* Three\n\n### Process\n\n* Start with a water base\n* Add the ingredients\n* Gently heat and stir until the mixture turns purple",
  options: {
    "Next page": {
      actions:
        "## Auto-Refractive Tincture\n\nWant to be sneaky or cause a real fright? This marvellous tincture will hide you from sight.\n\n### Ingredients\n\n* One\n* Two\n* Three\n\n### Process\n\n* One\n* Two\n* Three",
      options: {
        "Next page": {
          actions: "placeholder",
          options: {
            "Previous page": null,
            "Stop reading": stopReading
          }
        },
        "Previous page": null,
        "Stop reading": stopReading
      }
    },
    "Stop reading": stopReading
  }
});

readGrimoire.graph.options["Next page"].options["Previous page"] =
  readGrimoire.graph;
readGrimoire.graph.options["Next page"].options["Next page"].options[
  "Previous page"
] = readGrimoire.graph.options["Next page"];

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

apothecary.addItems(bookShelf);
