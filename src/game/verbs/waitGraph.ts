import { OptionGraph } from "../interactions/optionGraph";
import { RandomText } from "../interactions/text";

export default function createWaitGraph() {
  const waitText = new RandomText(
    "You pause for a moment, taking stock of the situation.",
    "You look around you and drink in your surroundings, letting the moment linger.",
    "You stop and think. Yes, you're sure there's a way out of this mess.",
    "You wonder aloud whether you'll make it home alive. No-one answers.",
    "How did you get yourself into this pickle? And how to clamber out?"
  );

  const stopWaitingText = new RandomText(
    "You snap out of your reverie and return your attention to the room.",
    "You've waited long enough. You get back to the task at hand.",
    "Satisfied everything's in order, you consider what to do next."
  );

  const waitNodes = [
    {
      id: "wait",
      actions: waitText,
      options: {
        "Keep waiting": "wait",
        "Stop waiting": "stop"
      }
    },
    {
      id: "stop",
      noEndTurn: true,
      actions: stopWaitingText
    }
  ];

  return new OptionGraph.Builder("wait")
    .isResumable(false)
    .withNodes(...waitNodes)
    .build();
}
