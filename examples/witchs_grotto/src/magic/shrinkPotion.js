import {
  addSchedule,
  forget,
  getBasicItemList,
  moveItem,
  retrieve,
  Schedule,
  selectInventory,
  selectInventoryItems,
  selectRoom,
  SequentialText,
  setInventoryCapacity,
  store,
  TIMEOUT_MILLIS,
  TIMEOUT_TURNS
} from "../../../../lib/gonorth";
import { Potion, Procedure, STEP_BLOOD, STEP_HEAT, STEP_INGREDIENTS, STEP_STIR, STEP_WORDS } from ".";
import { Ingredient } from "./ingredient";

let shrinkProcedure;

export const getShrinkProcedure = () => shrinkProcedure;

export const initShrinkProcedure = () => {
  const playerTinyTimer = new Schedule.Builder()
    .withCondition(() => retrieve("playerTiny"))
    .addEvent("Sudden butterflies in your stomach suggest something's happening.")
    .withDelay(10, TIMEOUT_TURNS)
    .addEvent("Your arms and legs are aching. Does the floor appear a little further away than it was?")
    .withDelay(3, TIMEOUT_TURNS)
    .addEvent(
      "There's no doubt that you're growing now. Your progress upwards is almost fast enough to be visible to the eye. Every time you look down, though, you can see that you're higher up."
    )
    .withDelay(3, TIMEOUT_TURNS)
    .addEvent("Nearly back to normal, your rate of growth is slowing.")
    .withDelay(5000, TIMEOUT_MILLIS)
    .addEvent(
      () => forget("playerTiny"),
      () => setInventoryCapacity(10),
      "With great relief, you find yourself back at your usual size. You don't seem to be growing any more."
    )
    .withDelay(5000, TIMEOUT_MILLIS)
    .recurring()
    .build();
  addSchedule(playerTinyTimer);

  const shrinkPotion = new Potion.Builder("Tonic of Vertical Contraction")
    .withAliases("shrink", "tiny", "shrink potion")
    .withDescription(
      "You're not sure why it's called a 'tonic' - it doesn't even look like a liquid. In fact, it resembles something living; it pulses, throbs and wriggles around inside the bottle. It's vaguely blue in colour and has a faint specularity on its writhing surfaces."
    )
    .isDrinkable()
    .withDrinkEffects(
      () => store("playerTiny", true),
      new SequentialText(
        "As you bring the bottle to your lips, the wriggling, animal-like thing inside presses itself into the bottle's neck, as if eager to crawl into your mouth. Bracing yourself, you upend the vessel and drink, swallowing quickly before you have time to feel the substance squirming in your throat.",
        "There's a strange sensation of everything seeming to loom up around you, quickly replaced by a vertiginous impression of falling from a great height. It's a good job you haven't eaten recently."
      ),
      () => {
        setInventoryCapacity(1);
        const getTotalCarrying = () => selectInventoryItems().reduce((total, item) => total + item.size, 0);
        const room = selectRoom();
        const droppedItems = [];

        // Drop items we can no longer carry.
        while (getTotalCarrying() > selectInventory().capacity) {
          const item = selectInventoryItems()[0];
          moveItem(item, room);
          droppedItems.push(item);
        }

        if (droppedItems.length) {
          return `The things you're carrying seem suddenly enormous. You're forced to drop ${getBasicItemList(
            droppedItems,
            true
          )}.`;
        }
      },
      "The room around you continues to feel more and more vast as you shrink and shrink. You hope the shrinking stops before you wink out of existence. Mercifully, it halts when you're not much larger than a mouse. Right then. You pray there aren't any cats around."
    )
    .build();

  shrinkProcedure = new Procedure.Builder()
    .withPotion(shrinkPotion)
    .isOrdered()
    .withSpirit("cavernous")
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
          "The words roll from your lips, starting as a whisper and progressing to a jubilant shout. Your spirit soars. Before your eyes, the sticky mess in the cauldron coheres and solidifies, becoming a pale blue paste."
        )
        .withShortText("a very pale blue paste")
        .build()
    )
    .build();

  // TODO Hide this somewhere.
  const peridotGemstone = new Ingredient.Builder("peridot gemstone")
    .withDescription("A glassy, pale green gemstone with a deeply cavernous spirit.")
    .withSpirit("cavernous")
    .build();

  return shrinkProcedure;
};
