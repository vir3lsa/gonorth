import { CyclicText, selectPlayer } from "../../../../lib/gonorth";
import {
  Potion,
  Procedure,
  STEP_FAT,
  STEP_WATER,
  STEP_WORDS,
  STEP_INGREDIENTS,
  STEP_HEAT,
  STEP_STIR,
} from "./alchemy";
import { potionEffects, DRINK } from "./magicEffects";

let dolittleProcedure;

export const initDolittleProcedure = () => {
  const dolittleDecoction = new Potion("Dolittle Decoction", "It's thick like treacle but a bright sickly green.");

  dolittleProcedure = new Procedure(
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
          text: "As you utter the last word, a sudden hush falls over the entire room, as though your ears have been stuffed with cotton wool. You sense a Lunar presence."
        },
        {
          ordered: false,
          steps: [
            {
              type: STEP_INGREDIENTS,
              value: ["devil's claw"],
              text: "The claw-like dried fruits float on the surface of the mixture."
            },
            {
              type: STEP_INGREDIENTS,
              value: ["piece of fruit"],
              text: "The fruit sinks to the bottom, releasing small bubbles that rise and gently disturb the surface."
            },
            { type: STEP_HEAT, value: 2, leniency: 5 },
            {
              type: STEP_STIR,
              value: 2,
              leniency: 2,
              text: new CyclicText(
                "The ingredients are beginning to mix together.",
                "The potion is matt and opaque in appearance."
              ),
              short: new CyclicText("partially mixed", "matt and opaque")
            }
          ]
        },
        {
          ordered: false,
          steps: [
            {
              type: STEP_STIR,
              value: 2,
              text: new CyclicText(
                "The surface of the concoction is becoming smooth and shiny.",
                "The potion is now so reflective you can see your own face in it, bending and warping as you stir."
              ),
              short: new CyclicText("smooth and shiny", "mirror smooth"),
              leniency: 2
            },
            { type: STEP_HEAT, value: 2, leniency: 4 }
          ]
        },
        {
          type: STEP_INGREDIENTS,
          value: ["crow skull powder"],
          text: "The image of your face in the surface of the mixture is obscured by the powder."
        },
        { type: STEP_HEAT, value: 1, leniency: 4 },
        {
          ordered: false,
          steps: [
            {
              type: STEP_STIR,
              value: 2,
              text: new CyclicText(
                "The powder is almost stirred in. You can see yourself again, but you look...different.",
                "The mirrored surface has fully returned to the potion but it's now showing you as...a peacock? Is that your spirit animal?"
              ),
              short: new CyclicText("semi-stirred and semi-reflective", "reflecting you in animal form"),
              leniency: 1
            },
            { type: STEP_HEAT, value: 2, leniency: 4 }
          ]
        },
        {
          type: STEP_WORDS,
          value: ["charm of the beast"],
          text: "A sound like a guttural roar eminates from the bubbling cauldron and you realise with surprise that it was your own reflection, now in the form of a lion, that roared.",
          short: "reflecting your face in lion form"
        }
      ]
    },
    dolittleDecoction
  );

  potionEffects.add(
    dolittleDecoction,
    DRINK,
    true,
    () => (selectPlayer().dolittle = true),
    "Throwing your head back, you down the vial of Dolittle Decoction in one, as though it were foul medicine. To your surprise, the flavour, whilst a little meaty, is not unpleasant.\n\nYou don't feel any different, but something must have happened, right?"
  );
  return dolittleProcedure;
};
