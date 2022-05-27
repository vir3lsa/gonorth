import { Room, Item, Container } from "../../../../../lib/gonorth";
import { initCat } from "./cat";

let snug;
let memoCard;

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
        .hidesItems(
          new Item.Builder()
            .withName("toy cart")
            .withAliases("model", "horse", "drawn", "trap", "wagon", "carriage")
            .withContainerListing("There aren't any logs in it, but there is...a model wagon?")
            .withDescription(
              "It's quite a lovely thing, with intricate wooden details including the driver's box, a passenger cabin complete with four curtained cross-framed windows, big multi-spoked wagon wheels and carriage steps to climb aboard.\n\nThere's something not quite right about it, though. Some sense that what you're seeing isn't what's really in front of you, like a mirage or an optical illusion."
            )
            .isHoldable()
            .build()
        )
        .build()
    )
    .build();

  snug.addItems(initCat(), drawers, fireplace);

  return snug;
};
