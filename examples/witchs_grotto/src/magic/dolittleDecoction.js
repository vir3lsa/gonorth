import { Potion, Procedure, STEP_FAT, STEP_WATER, STEP_WORDS } from "./alchemy";

const dolittleDecoction = new Potion(
  "Dolittle Decoction",
  "It's thick like treacle but a bright sickly green."
);

export const dolittleProcedure = new Procedure(
  {
    ordered: true,
    spirit: ["moon"],
    steps: [
      {
        ordered: false,
        steps: [
          { type: STEP_FAT, value: 0.5 },
          { type: STEP_WATER, value: 0.25 }
        ]
      },
      {
        type: STEP_WORDS,
        value: ["Lunar Incantation"],
        text:
          "As you utter the last word, a sudden hush falls over the entire room, as though your ears are stuffed with cotton wool. You sense a Lunar presence."
      }
    ]
  },
  dolittleDecoction
);
