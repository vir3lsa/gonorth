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
        .withText("The fat is fairly cool.", "The fat is warm.")
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
          "The ladle sloshes through the black liquid.",
          "The liquid has thickened up. The ladle is leaving a trail behind it as it moves.",
          "The colour has altered ever-so-slightly to contain the barest hint of deep crimson.",
          "The mixture is less of a liquid now and more of a wet dough-like consistency.",
          "All traces of wetness are gone. You could form the red-black substance into clumps.",
          "It's starting to look very dry. Maybe it's finished?",
          "Such a solid mass is forming that you can no longer really reshape it."
        )
        .withShortText(
          "an evil-looking black liquid",
          "an oil-like black liquid",
          "a thick dark red liquid",
          "a dark red dough-like substance",
          "a dark red paste",
          "a dry, red-black amalgamation",
          "a solid mass, like a blood clot"
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
      new Procedure.StepBuilder(STEP_HEAT, 5).withLeniency(5).build(),
      new Procedure.StepBuilder(STEP_STIR, 3)
        .withLeniency(5)
        .withText(
          "The mixture resists the movement of the ladle, as though unseen hands are pushing it in the opposite direction.",
          "The ceaseless movement of the cauldron's contents intensifies, sloshing this way and that.",
          "The potion is like a wild animal, furiously whipping back and forth as if trying to escape.",
          "Disconcertingly, the concoction seems to be swirling in the *opposite* direction to your stirring.",
          "Whichever way you move the ladle, the crimson liquid rushes against it, creating lashing waves that threaten to splash you."
        )
        .withShortText(
          "energetic and restless",
          "sloshing about angrily of its own volition",
          "moving like a caged animal trying to break free",
          "swirling dizzyingly",
          "moving at odds to any impetus"
        )
        .build()
    )
    .withStep(
      new Procedure.StepBuilder(STEP_STIR, 1)
        .withLeniency(3)
        .withText(
          "The movement of the liquid finally dies down, and, as it does, slimy lumps of semi-solid matter begin to appear, giving the elixir the appearance of vomit.",
          "The mixture continues to be slimy and lumpy, solidifying unevenly.",
          "The disgusting appearance of the lumpy mess in the cauldron makes you nautious."
        )
        .withShortText("lumpy and semi-solid, like vomit", "slimy and unevenly solidified", "disgusting and congealed")
        .build()
    )
    .withStep(
      new Procedure.StepBuilder(STEP_WORDS, "spiritual apotheosis")
        .withSpirit("elevation")
        .withText(
          "The words roll from your lips, starting as a whisper and progressing to a jubilant shout. Your spirit soars. Before your eyes, the sticky mess in the cauldron coheres and solidifies, becoming a dark red paste."
        )
        .withShortText("a very dark red paste")
        .build()
    )
    .build();

  // TODO Hide this somewhere.
  const blackOnyx = new Ingredient.Builder("black onyx gemstone")
    .withDescription("A smooth, jet black stone, about the size of walnut. Its spirit is dark.")
    .withSpirit("dark")
    .build();

  // TODO Hide this somewhere.
  const riteOfSouls = new MagicWord.Builder("Rite of Souls")
    .withSayingDescription(
      "Solemnly, with eyes downcast and head bowed, you recount the litany for the dead. A deep melancholy washes over you and your soul weeps for the departed."
    )
    .build();

  // TODO Hide this somewhere.
  const gneissStone = new Ingredient.Builder("gneiss stone")
    .withDescription(
      "A rough, greyish-pink stone with many closely-spaced darker bands running through it. Its spirit is distinctly mountainous."
    )
    .withSpirit("mountainous")
    .build();

  // TODO Hide this somewhere.
  const litanyOfChange = new MagicWord.Builder("Litany of Change")
    .withSayingDescription("Speaking carefully and slowly, you chant the Litany of Change.")
    .build();

  // TODO Hide this somewhere.
  const spiritualApotheosis = new MagicWord.Builder("Spiritual Apotheosis")
    .withSayingDescription("Voice quavering, you utter the triumphant passages of the Spiritual Apotheosis.")
    .build();

  return growthProcedure;
};
