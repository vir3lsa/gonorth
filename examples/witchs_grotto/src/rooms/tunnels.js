import { OptionGraph, selectRoom, SequentialText, Room, goToRoom, Item, Door } from "../../../../lib/gonorth";

const forward = "f";
const reverse = "r";

const up = "up";
const down = "down";
const left = "left";
const right = "right";

let traversal = forward;
let mouldRoom = new Room(
  "Mould Room",
  "The tiny room is dank and smelly, green mould growing on nearly every surface. The floor is cobbled and the mould and damp are making the stones slick and treacherous. The room's empty save for half a rotten barrel in one corner."
);

const ricketyDoor = new Door(
  "rickety door",
  "It's barely more than a few flimsy planks nailed together and a couple of rusty iron hinges.",
  false,
  false,
  "The door swings open limply when you push it."
);

// Setter for traversal variable that deliberately doesn't return a value so we can use it inline to avoid messing up ActionChain.
const setTraversal = (direction) => {
  traversal = direction;
};

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
    actions: [
      () => setTraversal(left),
      new SequentialText(
        `You're in a long, gently ${direction(
          down
        )}ward-sloping stone tunnel. It appears to have been hacked out of the rock with pickaxes and shovels, leaving the walls and ceiling rough and indistinct from one another. There's no light but your night vision can make out details clearly, although in a certain grey-green monochrome.`,
        `${traversal === forward ? "On the left of the tunnel" : "Behind you"} is a solid wooden door.`,
        `${
          traversal === forward ? "A little way on you reach" : "Going left from the door there's "
        } a sudden drop in the tunnel's floor. Peering over the edge, it only looks five or six feet down - easily jumpable - but you won't be able to climb back up once you're down there.`
      )
    ],
    options: {
      "heavy wooden door": "shortcutDoorLocked",
      "jump down": { node: "tunnelDiode", actions: () => setTraversal(left) },
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
    actions: () => {
      if (traversal === left) {
        return new SequentialText(
          "Being careful not to scrape your skin on the rough stone, you lower yourself over the edge of the near-vertical drop to minimise the distance you'll have to fall. With your arms at full stretch it's around three feet to the rubbly ground below you. When you're sure you're ready you let go with your fingers and drop, bending your knees to a squat as you land to soften the impact. Straigtening up, you slap your hands together to free them of dust.",
          "The tunnel branches left and right in front of you. The way to the right is marked by an elaborately archivolted archway cut into the stone."
        );
      } else if (traversal === up) {
        return "Rounding the corner, you come upon a junction in the tunnel. To the right is the vertical tunnel section you jumped down earlier. Ahead is an elaborately archivolted archway.";
      } else {
        return "Passing beneath an elaborately archivolted archway, you come upon a junction in the tunnel. To the left is the vertical tunnel section you jumped down earlier. Ahead, the tunnel continues.";
      }
    },
    options: () => ({
      [traversal === left ? "go left" : traversal === up ? "go back" : "go forward"]: {
        node: "lowerPretzel",
        actions: () => setTraversal(left)
      },
      [traversal === left ? "go right" : traversal === up ? "go forward" : "go back"]: {
        node: "topRightPretzel",
        actions: () => setTraversal(up)
      },
      [traversal === left ? "go back" : traversal === up ? "go right" : "go left"]: "verticalFail"
    })
  },
  {
    id: "backToCellar",
    actions: ["You head back up the tunnel towards the cellar.", () => selectRoom().go("east")]
  },
  {
    id: "verticalFail",
    actions: [
      () => setTraversal(left),
      "Standing at the foot of the vertical wall in the tunnel, you crane your head back to see the top. You can't get anywhere near the lip when you jump and there's nothing you can grab onto on the wall itself. There's no going back that way. You turn around and head back to the tunnel junction."
    ],
    options: {
      "go left": { node: "lowerPretzel", actions: () => setTraversal(left) },
      "go right": { node: "topRightPretzel", actions: () => setTraversal(up) },
      "go back": "verticalFail"
    }
  },
  {
    id: "lowerPretzel",
    actions: () =>
      traversal === left
        ? "The tunnel quickly turns to the right before becoming much narrower. At one point you have to turn sideways to squeeze through. When it opens out again there's a rickety wooden door to your right. The corridor curves to the right beyond the door."
        : "Rounding the bend, there's a rickety wooden door to your left. Ahead, the tunnel narrows.",
    options: () => ({
      [traversal === left ? "round bend" : "go back"]: {
        node: "crossroads",
        actions: () => setTraversal(up)
      },
      "open rickety door": () => ricketyDoor.getVerb("open").attempt(),
      [traversal === left ? "go back" : "narrow tunnel"]: {
        node: "tunnelDiode",
        actions: () => setTraversal(up)
      }
    })
  },
  {
    id: "topRightPretzel",
    actions: "placeholder"
  },
  {
    id: "crossroads",
    actions: "placeholder"
  },
  {
    id: "mouldRoom",
    actions: () => goToRoom(mouldRoom)
  }
];

export const tunnelsGraph = new OptionGraph(...tunnelsNodes);
