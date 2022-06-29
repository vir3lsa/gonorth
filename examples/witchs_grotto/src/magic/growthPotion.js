import { CyclicText } from "../../../../lib/gonorth";
import { Potion, Procedure, STEP_BLOOD, STEP_FAT, STEP_HEAT, STEP_INGREDIENTS, STEP_STIR, STEP_WORDS } from ".";
import { Ingredient } from "./ingredient";
import { MagicWord } from "./magicWord";

let demonsPasteProcedure, growthProcedure;

export const getDemonsPasteProcedure = () => demonsPasteProcedure;
export const getGrowthProcedure = () => growthProcedure;

export const initGrowthProcedure = () => {
  const growthPotion = new Potion.Builder("Acromegaly Solution")
    .withDescription(
      "You're not sure why it's called a 'solution' - it doesn't even look like a liquid. In fact, it resembles something living; it pulses, throbs and wriggles around inside the bottle. It's vaguely brown in colour and has a faint specularity on its writhing surfaces."
    )
    .isDrinkable()
    .withDrinkEffects("placeholder")
    .build();

  const demonsPaste = new Ingredient.Builder("Demon's Paste")
    .withAliases("demon")
    .withDescription("It's a deep, deep red, almost black paste. It looks a little like black pudding.")
    .build();

  demonsPasteProcedure = new Procedure.Builder()
    .withPotion(demonsPaste)
    .isOrdered()
    .withSpirit("dark")
    .withUnorderedSteps(
      new Procedure.StepBuilder(STEP_FAT, 0.25).withLeniency(0.25).build(),
      new Procedure.StepBuilder(STEP_HEAT, 2)
        .withLeniency(1)
        .withText(new CyclicText("The fat is fairly cool.", "The fat is warm."))
        .build()
    )
    .withStep(
      new Procedure.StepBuilder(STEP_INGREDIENTS, "demonic")
        .withLeniency("demonic")
        .withText(
          "There's a loud *hiss* as the ingredient drops into the fat. It begins steaming as if it's become suddenly much hotter."
        )
        .withShortText("steaming despite not being hot")
        .build()
    )
    .withStep(
      new Procedure.StepBuilder(STEP_WORDS, "rite of souls")
        .withText(
          "As the words roll off your tongue, the contents of the cauldron darken, from pale yellow, to grey, to an evil-looking black."
        )
        .withShortText("black and nasty looking")
        .build()
    )
    .withStep(
      new Procedure.StepBuilder(STEP_STIR, 5)
        .withLeniency(10)
        .withText(
          new CyclicText(
            "The ladle sloshes through the black liquid.",
            "The liquid has thickened up. The ladle is leaving a trail behind it as it moves.",
            "The colour has altered ever-so-slightly to contain the barest hint of deep crimson.",
            "The mixture is less of a liquid now and more of a wet dough-like consistency.",
            "All traces of wetness are gone. You could form the red-black substance into clumps.",
            "It's starting to look very dry. Maybe it's finished?",
            "Such a solid mass is forming that you can no longer really reshape it."
          )
        )
        .withShortText(
          new CyclicText(
            "an evil-looking black liquid",
            "an oil-like black liquid",
            "a thick dark red liquid",
            "a dark red dough-like substance",
            "a dark red paste",
            "a dry, red-black amalgamation",
            "a solid mass, like a blood clot"
          )
        )
        .build()
    )
    .build();

  growthProcedure = new Procedure.Builder()
    .withPotion(growthPotion)
    .isOrdered()
    .withSpirit("mountainous")
    .withUnorderedSteps(
      new Procedure.StepBuilder(STEP_BLOOD, 0.25).withLeniency(0.25).build(),
      new Procedure.StepBuilder(STEP_INGREDIENTS, "calendula").build()
    )
    .withStep(
      new Procedure.StepBuilder(STEP_WORDS, "litany of change")
        .withText(
          "You sense energy building around you, like a great drawing of breath, an inhalation of potential. When you finish the words, all is still, waiting, anticipating."
        )
        .withShortText("looks like blood, but possesses a certain energy")
        .withLeniency(1)
        .build()
    )
    .withStep(
      new Procedure.StepBuilder(STEP_INGREDIENTS, "demon's paste")
        .withText(
          "There's an instant reaction when the ball of demon's paste drops into the bloody mixture. The liquid begins swirling around inside the cauldron in a mighty vortex, as though a giant plug has been pulled out. After a while, it settles back down, though continues to move restively this way and that."
        )
        .withShortText("dancing restlessly back and forth as though stirred by an unseen spoon")
        .withLeniency("demon's paste")
        .build()
    )
    .withUnorderedSteps(
      new Procedure.StepBuilder(STEP_HEAT, 5)
        .withLeniency(5)
        .withText("placeholder")
        .withShortText("placeholder")
        .build(),
      new Procedure.StepBuilder(STEP_STIR, 3)
        .withLeniency(5)
        .withText("placeholder")
        .withShortText("placeholder")
        .build()
    )
    .withStep(
      new Procedure.StepBuilder(STEP_STIR, 1)
        .withLeniency(3)
        .withText("placeholder")
        .withShortText("placeholder")
        .build()
    )
    .withStep(
      new Procedure.StepBuilder(STEP_WORDS, "spiritual apotheosis")
        .withSpirit("elevation")
        .withText("ph")
        .withShortText("ph")
        .build()
    )
    .build();

  // TODO Hide this somewhere.
  const blackOnyx = new Ingredient.Builder("black onyx gemstone")
    .withDescription("A smooth, jet black stone, about the size of walnut. Its spirit is dark.")
    .withSpirit("dark")
    .build();

  // TODO Hide this somewhere.
  const riteOfSouls = new MagicWord.Builder("rite of souls")
    .withSayingDescription(
      "Solemnly, with eyes downcast and head bowed, you recount the litany for the dead. A deep melancholy washes over you and your soul weeps for the departed."
    )
    .build();

  return growthProcedure;
};
