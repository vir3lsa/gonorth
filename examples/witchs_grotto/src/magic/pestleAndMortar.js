import { Item } from "../../../../lib/gonorth";

let pestleAndMortar;

export const getPestleAndMortar = () => pestleAndMortar;

export const initPestleAndMortar = () => {
  pestleAndMortar = new Item(
    "stone pestle and mortar",
    "A bowl and stick, both wrought from stone, used for grinding ingredients into a fine powder.",
    true
  );
  pestleAndMortar.aliases = ["mortar", "pestle", "bowl", "grinder"];
  pestleAndMortar.preposition = "with";
  return pestleAndMortar;
};