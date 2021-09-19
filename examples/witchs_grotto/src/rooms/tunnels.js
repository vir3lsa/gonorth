import { OptionGraph, selectRoom, SequentialText } from "../../../../lib/gonorth";

const forward = "f";
const reverse = "r";

const up = "up";
const down = "down";
const left = "left";
const right = "right";

let traversal = forward;

const direction = (direction) => {
  if (traversal === forward) {
    return direction;
  }

  switch (direction) {
    case up:
      return down;
    case down:
      return up;
    case left:
      return right;
    case right:
      return left;
  }
};

const tunnelsNodes = [
  {
    id: "tunnelsStart",
    actions: new SequentialText(
      `You're in a long, gently ${direction(
        down
      )}ward-sloping stone tunnel. It appears to have been hacked out of the rock with pickaxes and shovels, leaving the walls and ceiling rough and indistinct from one another. There's no light but your night vision can make out details clearly, although in a certain grey-green monochrome.`,
      `${traversal === forward ? "On the left of the tunnel" : "Behind you"} is a solid wooden door.`,
      `${
        traversal === forward ? "A little way on you reach" : "Going left from the door there's "
      } a sudden drop in the tunnel's floor. Peering over the edge, it only looks five or six feet down - easily jumpable - but you won't be able to climb back up once you're down there.`
    ),
    options: {
      "heavy wooden door": "shortcutDoorLocked",
      "jump down": "tunnelDiode",
      "back to cellar": "backToCellar"
    }
  },
  {
    id: "shortcutDoorLocked",
    actions:
      "There's no handle or anything else to grab onto so you give the heavy door a solid push. It moves less than a centimetre before a metallic clang announces an end to your efforts. It's locked from the other side.",
    options: {
      "heavy wooden door": "shortcutDoorLocked",
      "jump down": "tunnelDiode",
      "back to cellar": "backToCellar"
    }
  },
  {
    id: "tunnelDiode",
    actions: "placeholder"
  },
  {
    id: "backToCellar",
    actions: ["You head back up the tunnel towards the cellar.", () => selectRoom().go("east")]
  }
];

export const tunnelsGraph = new OptionGraph(...tunnelsNodes);
