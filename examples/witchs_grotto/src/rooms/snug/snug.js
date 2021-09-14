import { Room, Item, Verb, Container } from "../../../../../lib/gonorth";
import { dolittleDecoction } from "../../magic/dolittleDecoction";
import { cat } from "./cat";

export const snug = new Room(
  "Snug",
  "You find yourself in a cozy snug or cubby. The embers of a fire still glow in a small fireplace and give off a gentle warmth. There's a single large armchair with a black cat curled up in it just in front of the stone hearth. Various leather-bound books are scattered around the room or lie in small piles. There are thick cobwebs in the corners of the room, testament to the witch's aversion to housework. Against one wall there's a small chest of drawers.\n\nThe only way out is via the moon and stars bead curtain to the East."
);

export const memoCard = new Item(
  "memo card",
  "It's about the size of your hand, with rounded corners and a glossy finish. It appears to be made of very high quality paper or vellum. On the face of the card is the heading\n\n## Here lies a secret\n\nwritten in a swirly script. The large area beneath the heading is blank.",
  true,
  0.5
);

memoCard.addAliases("paper", "vellum", "parchment");

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

snug.addItems(
  cat,
  drawers,
  // TEMP
  dolittleDecoction
  // TEMP
);
