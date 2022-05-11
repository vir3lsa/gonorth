import { Item, englishList, RandomText } from "../../../../lib/gonorth";

let pentagram;

export const getPentagram = () => pentagram;

export const initPentagram = () => {
  pentagram = new Item("pentagram", () => {
    let description =
      "A five-pointed star with the topmost point aiming directly at the cauldron. There are spaces just behind each apex where objects may be placed. The design itself appears to have been painted in blood.";

    let spirits = [...pentagram.uniqueItems].map((item) => item.spirit);
    const muddled = spirits.find((spirit) => !spirit);
    let spiritText;

    if (muddled) {
      spiritText = new RandomText(
        "The spirit emanating from the pentagram is muddled.",
        "The spirit emanating from the pentagram feels confused.",
        "The spirit emanating from the pentagram is muddy"
      );
    } else if (spirits.length) {
      spiritText = `Emanating from the pentagram and filling the whole room is a distinctive spirit of ${englishList(
        spirits
      )}.`;
    } else {
      spiritText = "The spirit emanating from the pentagram is neautral.";
    }

    return `${description}\n\n${spiritText}`;
  });

  pentagram.addAliases("five pointed star");
  pentagram.capacity = 5;
  pentagram.preposition = "on";
  return pentagram;
};
