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
  Verb,
  AutoAction,
  addAutoAction
} from "../../../../../lib/gonorth";
import {
  ABOARD_BOAT,
  ACROSS_LAKE,
  BOAT_IN_WATER,
  PLAYER_TINY,
  TOY_BOAT_MENDED,
  TOY_BOAT_SOLIDITY
} from "../../utils/persistentVariables";
import { initCat } from "./cat";

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
        .withAliases("board", "climb", "go")
        .isRemote()
        .withTest(() => retrieve(PLAYER_TINY) && !retrieve(ABOARD_BOAT))
        .withOnSuccess(
          () => store(ABOARD_BOAT, true),
          () => {
            let description = "You're now the perfect size to step onto the boat. ";

            if (retrieve(BOAT_IN_WATER)) {
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
          () => {
            if (retrieve(BOAT_IN_WATER)) {
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
