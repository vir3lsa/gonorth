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
  id: "mending",
  actions:
    "## Elixir of Mending\n\nGot something that's broken or smashed into bits?\nOne drop of this potion, it's instantly fixed!\n\n### Ingredients\n\n* 3 dryad toenails\n* 1 handful of alfalfa leaves\n* 1 bundle white sage\n\n### Process\n\n* Start with a water base\n* Add the ingredients\n* Gently heat and stir until the mixture turns purple",
  options: {
    "Next page": {
      id: "invisibility",
      actions:
        "## Auto-Refractive Tincture\n\nWant to be sneaky or cause a real fright? This marvellous tincture will hide you from sight.\n\n### Ingredients\n\n* 1 clump of a black cat's fur\n* A cup of burdock root\n* A sprinkling of devil's claw\n* A thimble of newt eyes\n\n### Process\n\n* Work from a basis of animal fat\n* Add the fur and bring the mixture to the boil\n* Add the burdock root and the devil's claw and remove the heat\n* Utter an incantation of binding\n*Finally, add the newt eyes",
      options: {
        "Next page": {
          id: "sleep",
          actions:
            "## Sleeping Draught\n\nIf you're tired and grumpy and up all the night\n\nJust sip on this brew, you'll be out like a light.\n\n###Ingredients\n\n* A pinch of mandrake root, powdered\n* A handful of sage - your choice of colour\n* half a pint of slug mucus\n\nProcess\n\n* One\n* Two\n* Three",
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

readGrimoire.getNode("invisibility").options["Previous page"] =
  readGrimoire.graph;
readGrimoire.getNode("sleep").options["Previous page"] = readGrimoire.getNode(
  "invisibility"
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
bookShelf.aliases = ["library", "books", "bookshelf"];
bookShelf.hidesItems = grimoire;
bookShelf.itemsCanBeSeen = false;
bookShelf.preposition = "on";

const herbarium = new Item(
  "herbarium",
  "This must be the witch's herbarium. You have to admit it's an impressive sight. Multiple shelves line the walls, every inch filled with dusty glass jars, racks of vials, and stoppered bottles. They're all meticulously labelled with swirly handwritten names on paper sleeves, but many of them are indecipherable. You take a mental note of the ones you understand. You see:\n\n* Alfalfa\n* Astragalus\n* Bladderwrack\n* Blue Sage\n* Burdock Root\n* Calendula\n* Dandelion\n* Devil's Claw\n* Dryad Toenails\n* Feverfew\n* Hibiscus\n* Horehound\n* Mandrake Root\n* Mugwort\n* Slug Mucus\n* Valerian\n* Vervain\n* White Sage\n* Witch Hazel\n* Wormwood"
);

const alfalfa = new Item("alfalfa", "A jar of dried alfalfa leaves.");

herbarium.capacity = 20;
herbarium.aliases = ["vials", "jars", "bottles", "ingredients"];
herbarium.hidesItems = alfalfa;
herbarium.itemsCanBeSeen = false;

const cauldron = new Item(
  "cauldron",
  "A large cast-iron pot that fills the fireplace. It stands on three stubby legs and has space beneath it to light a fire. There's a valve at the bottom to let the contents drain away into a stone channel in the floor that runs down one side of the room and disappears through into the wall. There's apparatus above the cauldron for filling it with a range of liquids."
);

apothecary.addItems(bookShelf, herbarium, cauldron);
