import {
  Room,
  Item,
  Container,
  addEffect,
  store,
  retrieve,
  update,
  forget,
  SequentialText,
  JoinedText,
  PagedText,
  Verb,
  AutoAction,
  addAutoAction,
  theEnd
} from "../../../../../lib/gonorth";
import {
  ABOARD_BOAT,
  ACROSS_LAKE,
  PLAYER_TINY,
  TOY_BOAT_MENDED,
  TOY_BOAT_SOLIDITY
} from "../../utils/persistentVariables";
import { initCat } from "./cat";

const DIRECTIONS = ["north", "south", "east", "west"];
const OPEN_DIRECTIONS = ["north", "south"];

let snug;
let memoCard;
let toyWagon;

export const getMemoCard = () => {
  return memoCard;
};

export const initMemoCard = () => {
  memoCard = new Item(
    "memo card",
    "It's about the size of your hand, with rounded corners and a glossy finish. It appears to be made of very high quality paper or vellum. On the face of the card is the heading\n\n## Here lies a secret\n\nwritten in a swirly script. The large area beneath the heading is blank.",
    true,
    0.5
  );
  memoCard.addAliases("paper", "vellum", "parchment");

  return memoCard;
};

export const getSnug = () => {
  return snug;
};

export const initSnug = () => {
  initMemoCard();

  snug = new Room(
    "Snug",
    "You find yourself in a cozy snug or cubby. The embers of a fire still glow in a small fireplace and give off a gentle warmth. There's a single large armchair with a black cat curled up in it just in front of the stone hearth. Various leather-bound books are scattered around the room or lie in small piles. There are thick cobwebs in the corners of the room, testament to the witch's aversion to housework. Against one wall there's a small chest of drawers.\n\nThe only way out is via the moon and stars bead curtain to the East.",
    true
  );

  const drawers = new Container(
    "chest of drawers",
    ["drawer"],
    "It's an unremarkable chest of drawers made from a dull grey wood. It's covered in knocks and scratches as though it's been through a lot.",
    "Rummaging through the open drawers, you find a lot of uninteresting junk including socks, cutlery and wicker place-mats.",
    6
  );

  drawers.hidesItems = memoCard;
  drawers.openText = "The drawers slide smoothly open.";
  drawers.alreadyOpenText = "The drawers are already open.";
  drawers.closeText = "You push the drawers closed with a soft thud.";
  drawers.alreadyClosedText = "The drawers are already closed.";

  toyWagon = new Item.Builder()
    .withName("toy wagon")
    .withAliases("model", "horse", "drawn", "trap", "cart", "carriage")
    .withContainerListing("There aren't any logs in it, but there is...a model wagon?")
    .withDescription(
      "It's quite a lovely thing, with intricate wooden details including the driver's box, a passenger cabin complete with four curtained cross-framed windows, big multi-spoked wagon wheels and carriage steps to climb aboard.\n\nThere's something not quite right about it, though. Some sense that what you're seeing isn't what's really in front of you, like a mirage or an optical illusion."
    )
    .isHoldable()
    .withSize(3)
    .build();

  const toyBoat = new Item.Builder()
    .withName("toy boat")
    .withAliases("dinghy", "wagon")
    .withDescription(() => {
      const descriptionTexts = [
        "A charming model of a wooden dinghy - the kind Grandad used to row out into the middle of the lake in the valley to fish."
      ];

      if (retrieve(TOY_BOAT_MENDED)) {
        descriptionTexts.push("It's fully repaired and in shipshape condition.");
      } else {
        descriptionTexts.push(
          "It won't be any good for rowing in its current state, though, even for dolls, owing to the giant hole in the hull."
        );
      }

      return new JoinedText(" ", ...descriptionTexts);
    })
    .isHoldable()
    .withSize(3)
    .withVerbs(
      new Verb.Builder("enter")
        .withAliases("board", "climb", "go", "get in")
        .isRemote()
        .withTest(() => retrieve(PLAYER_TINY) && !retrieve(ABOARD_BOAT))
        .withOnSuccess(
          () => store(ABOARD_BOAT, true),
          ({ item }) => {
            let description = "You're now the perfect size to step onto the boat. ";

            if (item.container?.name === "lake") {
              description +=
                "Being careful not to fall into the water, you gingerly clamber aboard, the dinghy bobbing slightly as it takes your weight. ";
            }

            if (retrieve(TOY_BOAT_MENDED)) {
              return (
                description +
                "Marvelling at the craftsmanship of what's ostensibly a toy, you take up your place on the wooden plank that acts as a seat."
              );
            }

            return (
              description +
              "Your feet dangle right through the ragged hole in the hull as you sit on the wooden plank seat."
            );
          }
        )
        .withOnFailure(() => {
          if (!retrieve(PLAYER_TINY)) {
            return "The boat's tiny. You could crush it under your foot. You can't board it.";
          } else if (retrieve(ABOARD_BOAT)) {
            return "You're already aboard the dinghy.";
          }
        })
        .build(),
      new Verb.Builder("leave")
        .withAliases("exit", "disembark", "jump")
        .withTest(() => retrieve(ABOARD_BOAT) && !retrieve(ACROSS_LAKE))
        .withOnSuccess(
          () => forget(ABOARD_BOAT),
          ({ item }) => {
            if (item.container?.name === "lake") {
              return "Daintily, you step out of the boat and onto dry land.";
            }

            return "You clamber out of the boat.";
          }
        )
        .withOnFailure(() => {
          if (!retrieve(ABOARD_BOAT)) {
            return "You're not in the boat.";
          } else if (retrieve(ACROSS_LAKE)) {
            return "You *could* jump out of the boat into the deep, black, icy cold water...but you decide against it. It would be better to be by the shore first.";
          }
        })
        .isRemote()
        .build(),
      new Verb.Builder("row")
        .withAliases("paddle")
        .withTest(
          ({ item, other }) =>
            retrieve(PLAYER_TINY) &&
            retrieve(ABOARD_BOAT) &&
            retrieve(TOY_BOAT_MENDED) &&
            item.container?.name === "lake" &&
            ((!retrieve(ACROSS_LAKE) && other?.name === "south") ||
              (retrieve(ACROSS_LAKE) && OPEN_DIRECTIONS.includes(other?.name)))
        )
        .withOnSuccess(({ other }) => {
          const acrossLake = retrieve(ACROSS_LAKE);

          if (acrossLake && other.name === "north") {
            forget(ACROSS_LAKE);
            return "Return to shore placeholder";
          } else if (acrossLake && other.name === "south") {
            forget(ACROSS_LAKE);
            return [
              "With a certain amount of trepidation, you paddle the boat slowly but surely into the tunnel mouth. Even as you pass beneath the threshold it remains completely pitch black within, giving no hint at what lies beyond.",
              new PagedText(
                "After a short while you turn your head to find that the opening to the cave has dropped further behind than you were expecting - there must be current drawing you along the tunnel. The opening is visible as a dim circle, only slightly brighter than the surrounding blackness."
              ),
              new SequentialText(
                "Sounds are amplified in here, echoing back and forth along the rock walls of the tunnel. The sounds of water dripping from the roof just a couple of feet above your head and lapping at the sides of the boat reverberates loudly, disconcertingly. The space feels very small. It occurs to you that the stone roof could lower suddenly, or jut downwards in rocky outcrops and you'd be completely unaware of the approaching danger in the total darkness. Until you painfully, or even fatally, hit your head on something hard and sharp.",
                "Loud bumping and scraping alerts you to the fact the boat is colliding with the tunnel wall. The undergound river must be rounding a bend. Using your hands to push off from the wall, you help to ease the boat round the curve. After giving the cold rock a good shove to push the boat back out into the middle of the tunnel, you're rewarded with a few moments of smooth travel before the boat bumps the wall on the other side. This continues for several minutes, the boat ricocheting from one side of the space to the other. You dearly hope this isn't doing any damage to the dinghy.",
                "Finally, the channel straightens out again and you're afforded more smooth, uninterrupted progress. It's still utterly dark. You can't see your own hand held an inch from your face. You know the pace must have picked up, however, because you can feel a light breeze on your face and hear the sound of rushing water all around you. Any collision now could do serious damage to both you and the little vessel. You sink lower into the boat, choosing to sit on the floor of the hull rather than on the seat where you feel far too exposed.",
                "Sitting huddled in the bottom of the wooden craft, bobbing along on the river's current, you don't immediately notice the grey light swelling around you. First you can dimly make out your shoes, then the end of the boat. Before long you can see the blacks and greens of the wet rock overhead. You're not moving as quickly now, you notice, so you scramble back up onto the seat and gaze along the shaft ahead of you. In front, about a hundred metres away is one of the most beautiful things you've ever seen. A ragged, almost circular opening, through which the river is flowing and daylight is streaming in. You've almost made it. Your heart beats wildly in your chest. You're going to make it!",
                "A minute later the dinghy leaves the tunnel and you drift out into a glorious forest evening. You just sit there, barely able to believe it, as the river meanders through the trees in the light of the setting sun. Eventually you come to your senses and steer the boat towards a sandy bank where you moor it and hop out. Just as you do so, the shrink potion wears off, returning you to your normal size. You breathe a sigh of relief that it didn't happen inside the tunnel.",
                "You know this place, you realise, as you look about you. You've come here to collect water, and to catch fish with Grandad. Just past the oaks over there is a winding path through the bracken that will lead back to the cottage where Mother will no doubt be waiting, wondering why you're not home yet. You set off quickly, keen to get back to safety and to leave this nightmare behind."
              ),
              new PagedText(
                "The little path wends its way through the woods, just like you remember, past familiar bramble bushes, across familiar clearings and over familiar little streams. The sun is completely set by the time you emerge from beneath the slender beeches and see the tiny cottage where you live with Mother."
              ),
              new SequentialText(
                "You enter through the kitchen door and call out, \"Mother! I'm back!\" but there's no reply. That's strange.",
                'You head through into the living area but there\'s no sign of her in here, just the empty chairs where you sit down for meals. "Mother!" you call again, a little knot of unease forming in the pit of your stomach. Nothing.',
                "She's not in the bedroom either. Where could she be? Perhaps she's out looking for you now, frantically scouring the woods for any sign. No, you haven't been gone *that* long. She wouldn't have resorted to that yet, would she?",
                "You turn and step back through into the living room only for your blood to freeze and your heart to stop. You let out a scream. Standing by the kitchen door, staring menacingly straight at you, is the witch. She's found you.",
                '"Hello, Genevieve," she says, in a voice as smooth as honey, a faint smile flickering on her lips. "Your mother\'s sleeping quite soundly out by the wood store. She must be exhausted with worry, the poor thing."',
                '"What have you done to her?" you sob.',
                "\"Oh, don't worry. She'll be fine. She'll wake up in a few hours and wonder what ever happened. But enough about her. I'm here for *you*, Genevieve. I was simply going to *eat* you, but you've proven yourself quite unexpectedly gifted in certain...arcane arts. It would be a terrible shame for that to go to waste. Come! We have fearful work to do.\"",
                "With that, she snaps her fingers and, to your horror, your legs move unbidden, following the witch through the kitchen and out into the expectant dusk."
              ),
              theEnd
            ];
          } else {
            store(ACROSS_LAKE, true);
            return new SequentialText(
              "You take hold of the oar handles and begin rowing. Rhythmically, the blades slide into the water, heave forwards, and emerge, dripping silver droplets. Steadily, the boat inches across the lake.",
              "Inky black water stretches away from the boat in all directions. You have no way of knowing how deep it is out here in the middle of the lake. In your mind, it stretches downwards, on and on, deeper and deeper into the bowels of the Earth. It descends for miles, hundreds of miles, maybe even forever. You picture the little boat and yourself in it, perched atop this infinite void and feel very small indeed.",
              "Eventually, you reach the far side of the lake and come to rest beside the tunnel mouth you could see from the shore. Looking back that way, ripples set in motion by your passage across the water still spread over the otherwise smooth surface."
            );
          }
        })
        .withOnFailure(({ item, other }) => {
          if (!retrieve(PLAYER_TINY)) {
            return "The boat's a toy. You can't get in it.";
          } else if (!retrieve(ABOARD_BOAT)) {
            return "You'd need to be *on* the boat to row it.";
          } else if (!retrieve(TOY_BOAT_MENDED)) {
            return "The boat's not going anywhere with that giant hole in the hull.";
          } else if (item.container?.name !== "lake") {
            return "The boat would need to be in water to be rowed.";
          } else if (!other || !DIRECTIONS.includes(other?.name)) {
            return "Row which way?";
          } else if (!OPEN_DIRECTIONS.includes(other?.name)) {
            return "There's nothing of interest in that direction - just the solid rock walls of the cavern.";
          } else if (!retrieve(ACROSS_LAKE) && other?.name === "north") {
            return "You're already on the lake's northern shore.";
          }
        })
        .isRemote()
        .makePrepositional("which way", true)
        .build()
    )
    .build();

  const boatVerbs = ["row"];
  const autoLeaveBoat = new AutoAction.Builder()
    .withCondition(
      ({ verb }) => retrieve(ABOARD_BOAT) && !boatVerbs.includes(verb.name) && !verb.isKeyword && !verb.remote
    )
    .withInputs("leave boat")
    .build();
  addAutoAction(autoLeaveBoat);

  store(TOY_BOAT_SOLIDITY, 0);
  addEffect(toyWagon, "mirror", "examine", true, ({ item: wagon }) => {
    const solidity = retrieve(TOY_BOAT_SOLIDITY);

    if (!solidity) {
      update(TOY_BOAT_SOLIDITY, solidity + 1);
      wagon.description =
        "It's a fuzzy blur of colours now, barely identifiable as a wagon. Something at the back of your mind recognises some other object in the distorted jumble of shapes and lines, but you can't quite pin down what it is.";
      return "In the mirror's magical glass, the wagon begins to blur more dramatically, its edges becoming hazy and indistinct. Another shape you can't quite make out yet is beginning to emerge.";
    } else {
      forget(TOY_BOAT_SOLIDITY);
      const container = wagon.container;
      container.removeItem(wagon);
      container.addItem(toyBoat);
      return new SequentialText(
        "That other shape hidden behind the wagon is coming into focus now. You recognise it at last.",
        "It's a toy boat - a tiny wooden dinghy, slightly pointed at the prow and flat at the stern. There are two plank seats stretching horizontally across the boat. Something bad appears to have befallen it as there's a jagged hole in the bottom.",
        "You can see the boat with perfect clarity now - all traces of the wagon are gone."
      );
    }
  });

  const fireplace = new Item.Builder()
    .withName("fireplace")
    .withAliases("fire", "hearth", "embers", "chimney")
    .withDescription(
      "A roaring fire must have been lit here a few hours ago; the logs have burnt down to oddly-shaped smouldering embers, occasionally spitting a spark or two onto the narrow stone hearth."
    )
    .hidesItems(
      new Container.Builder()
        .withName("log basket")
        .withAliases("wicker")
        .withContainerListing("Sitting on the hearth is a squat wicker log basket.")
        .withOpenDescription(
          "A wicker basket with two big handles extending from the rim. It's only big enough to carry a modest bundle of logs."
        )
        .isHoldable()
        .withSize(8)
        .withCapacity(8)
        .isOpen()
        .isCloseable(false)
        .hidesItems(toyWagon)
        .build()
    )
    .build();

  snug.addItems(initCat(), drawers, fireplace);

  return snug;
};
