import { CyclicText } from "../../../../lib/gonorth";
import {
  Potion,
  Procedure,
  STEP_FAT,
  STEP_WATER,
  STEP_WORDS,
  STEP_INGREDIENTS,
  STEP_HEAT,
  STEP_STIR
} from "./alchemy";

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
          "As you utter the last word, a sudden hush falls over the entire room, as though your ears have been stuffed with cotton wool. You sense a Lunar presence."
      },
      {
        ordered: false,
        steps: [
          {
            type: STEP_INGREDIENTS,
            value: ["devil's claw"],
            text:
              "The claw-like dried fruits float on the surface of the mixture."
          },
          {
            type: STEP_INGREDIENTS,
            value: ["piece of fruit"],
            text:
              "The fruit sinks to the bottom, releasing small bubbles that rise and gently disturb the surface."
          },
          { type: STEP_HEAT, value: 2, leniency: 5 },
          { type: STEP_STIR, value: 2, leniency: 2 }
        ]
      },
      {
        ordered: false,
        steps: [
          {
            type: STEP_STIR,
            value: 2,
            text: new CyclicText("one", "two"),
            short: new CyclicText("one", "two"),
            leniency: 2
          },
          { type: STEP_HEAT, value: 2, leniency: 4 }
        ]
      },
      {
        type: STEP_INGREDIENTS,
        value: ["crow skull powder"],
        text: "three"
      },
      { type: STEP_HEAT, value: 1, leniency: 4 },
      {
        ordered: false,
        steps: [
          {
            type: STEP_STIR,
            value: 2,
            text: new CyclicText("four", "five"),
            short: new CyclicText("four", "five"),
            leniency: 1
          },
          { type: STEP_HEAT, value: 2, leniency: 4 }
        ]
      },
      {
        type: STEP_WORDS,
        value: ["charm of the beast"],
        text:
          "A sound like a guttural roar eminates from the bubbling cauldron as its contents take on the colour and consistency of custard. It would almost look delicious if it weren't for the smell.",
        short: "thick and yellow like custard"
      }
    ]
  },
  dolittleDecoction
);
