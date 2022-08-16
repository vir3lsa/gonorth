import { addEffect, Item, retrieve, Room, Verb } from "../../../../lib/gonorth";

let cavern;

export const getCavern = () => {
  return initCavern;
};

export const initCavern = () => {
  cavern = new Room(
    "Cavern",
    "You're in a naturally-formed underground cavern. Around thirty feet across and vaguely egg-shaped, it's illuminated by sunlight slanting in through a narrow rock chimney in the roof. The stream that ran down the corridor you entered by joins a larger body of water lower down in the cave. Occasionally you catch a glimpse of flying things flitting in and out of the chimney. Bats?",
    true
  );

  const lake = new Item.Builder()
    .withName("lake")
    .withAliases("body of water", "pond", "stream")
    .withDescription(
      "It's a moderately-proportioned underground lake. Near the shore, the water's shallow and clear enough to see to the stoney bottom. Farther out, where the floor drops away to unknown depths, it's inky black and still. The lake stretches to the other side of the cavern, where a black opening in the rock reveals an underground river outlet."
    )
    .withCapacity(100)
    .withVerbs(
      new Verb.Builder()
        .withName("swim")
        .withAliases("dive", "cross", "float")
        .withTest(false)
        .withOnFailure(
          "There's no way you're diving into those murky waters. For a start, the water's freezing cold and, more importantly, there could be anything lurking in those depths."
        )
        .build(),
      new Verb.Builder()
        .withName("paddle")
        .withAliases("dip toes", "enter", "stand", "walk")
        .withOnSuccess(
          "Leaving your shoes on the shore, you gingerly place your feet into the icily cold water. Stepping carefully on the sharp and slippery stones at the bottom, you venture as deep as you dare, until you reach the point where the floor drops sharply away. You're not going any further."
        )
        .build()
    )
    .build();

  const opening = new Item.Builder()
    .withName("opening")
    .withAliases("hole", "exit", "river", "outlet", "tunnel")
    .withDescription(
      "The dark opening is a decent size - roughly semicircular and perhaps six feet in diameter. It rises from the surface of the lake like a mysterious archway leading who knows where?"
    )
    .withVerbs(
      new Verb.Builder()
        .withName("enter")
        .withAliases("leave", "swim", "go")
        .withTest(false)
        .withOnFailure(
          "The tunnel entrance is way over on the other side of the lake. You can't reach it without swimming and you don't much fancy that."
        )
        .build()
    )
    .build();

  const bats = new Item.Builder()
    .withName("bats")
    .withAliases("flying things", "bat")
    .withDescription(
      "They're visible only as swiftly-moving dark shapes picked out by the shaft of light entering through the chimney. Occasionally you hear the rustle of papery wings or a mouse-like squeak, letting you know the darker reaches of the cave's roof are teeming with the creatures."
    )
    .withVerbs(
      new Verb.Builder()
        .withName("take")
        .withAliases("snatch", "grab", "trap", "pick up", "hold")
        .withTest(false)
        .withOnFailure(
          "The bats are well out of your reach and, even if they weren't, they'd be moving much too quickly to be able to snatch one from the air."
        )
        .build()
    )
    .build();

  addEffect(
    "toy wagon",
    lake,
    "put",
    true,
    ({ item: toyWagon }) => {
      toyWagon.verbs.put.attempt(toyWagon, lake);
      toyWagon.containerListing =
        "Floating serenely in the shallow water near the shore, as if discarded by a fickle toddler, is the model wagon.";
    },
    "The toy wagon drops into the shallow water with a splash. It floats, owing to its wooden construction, albeit on its side. Close as it is to the shore, there's no current to pull it out of reach."
  );

  addEffect(
    "toy boat",
    lake,
    "put",
    true,
    async ({ item: toyBoat, fail }) => {
      const result = await toyBoat.verbs.put.attempt(toyBoat, lake);

      if (!result) {
        // Prevent the effect from going any further.
        fail();
      }

      return result;
    },
    ({ item: toyBoat }) => {
      if (retrieve("toyBoatMended")) {
        toyBoat.containerListing = "Floating happily in the shallow waters near the shore is the toy boat.";
        return "After entering the crystal clear water, its newly intact hull prevents any ingress and keeps it afloat. This close to the shore, there's no current, so there's no danger of losing it.";
      } else {
        toyBoat.containerListing = "Half submerged near the shore is the toy boat, floating on its side.";
        return "After entering the crystal clear water it floats serenely for a moment. Then, however, the water seeping in through the hole in its belly causes it to sit lower and lower, before eventually tipping to one side and partially capsizing. It doesn't sink, per se, owing to its lightweight wooden construction, but it's not exactly seaworthy.\n\nThis close to the shore, there's no current, so there's no danger of losing it.";
      }
    }
  );

  cavern.addItems(lake, opening, bats);
  return cavern;
};
