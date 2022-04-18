import { Room, RandomText, OptionGraph } from "../../../../lib/gonorth";
import { witch } from "./garden";

const cupboardGraph = new OptionGraph("pantryCupboard", {
  id: "root",
  actions:
    "A cobweb attaches to your face as you climb inside, but you ignore it and pull the door shut behind you. It's dark and dusty in here and there's an assortment of items on the floor under an old dust sheet that you try to avoid falling over. There's just enough of a gap around the edge of the door to peek out into the room beyond.",
  options: {
    Leave: {
      actions: () => cupboard.go("north"),
      exit: true
    },
    Peek: {
      actions: () => {
        const noone =
          "You put your eye to the crack at the side of the door. There doesn't appear to be anyone out there.";
        const watchOut = new RandomText(
          "You peer furtively round the side of the door and quickly recoil. The witch is in the room. You hold your breath."
        );
        return witch.container.name === "Pantry" ? watchOut : noone;
      }
    },
    Wait: {
      actions: "You hold your breath and wait, praying no-one finds you here."
    }
  }
});

export const cupboard = new Room("Cupboard", () => cupboardGraph.commence.chain());
