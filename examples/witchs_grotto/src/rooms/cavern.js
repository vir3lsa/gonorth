import { Item, Room, Verb } from "../../../../lib/gonorth";

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

  cavern.addItems(lake, opening, bats);
  return cavern;
};
