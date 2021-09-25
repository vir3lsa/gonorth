import {
  OptionGraph,
  selectRoom,
  SequentialText,
  Room,
  goToRoom,
  Item,
  Door,
  Verb,
  CyclicText
} from "../../../../lib/gonorth";
import { Ingredient } from "../magic/ingredient";

const forward = "f";
const reverse = "r";

const up = "up";
const down = "down";
const left = "left";
const right = "right";

let traversal = forward;
let mouldRoom = new Room(
  "Mould Room",
  "The tiny room is dank and smelly, green mould growing on nearly every surface. The floor is cobbled and the mould and damp are making the stones slick and treacherous. The room's empty save for half a rotten barrel in one corner.\n\nThe rickety wooden door leads back into the tunnels to the South."
);

const ricketyDoor = new Door(
  "rickety door",
  "It's barely more than a few flimsy planks nailed together and a couple of rusty iron hinges.",
  false,
  false,
  "The door swings open limply when you push it."
);

const mould = new Ingredient(
  "mould",
  "It's slimy and green and smells strongly earthy. You can practically feel the spores taking root in your nasal cavity as you inhale."
);

mould.article = "some";

const rottenBarrel = new Item(
  "rotten barrel",
  "It's standing on the jagged edges of the wooden staves that must have been broken when the barrel was somehow split in two, such that the open side is facing downwards. An animal or even a small person could hide beneath it if they were so inclined."
);

const barrelHideGraph = new OptionGraph({
  id: "hide",
  actions:
    "You can see much of the dank chamber through gaps between the barrel's wooden staves. There's nothing there.",
  options: {
    wait: "hide",
    leave: { exit: true, actions: "You lift the barrel and scramble out into the dimly lit room." }
  }
});

rottenBarrel.addVerb(
  new Verb(
    "hide",
    true,
    [
      "Scrabbling with your fingers to get a purchase on the underside of the barrel, you lift its surprising heft and awkwardly crawl beneath it. You let it drop back to the cobblestones with a rotten sounding thud, being careful not to trap your fingers.",
      () => barrelHideGraph.commence()
    ],
    null,
    ["enter"]
  )
);

mouldRoom.addItems(ricketyDoor, mould, rottenBarrel);

const carvedDoor = new Door(
  "carved wooden door",
  "The door is sturdy looking, the dark timber panels carved with ornamental patterns",
  false,
  false,
  "Lifting an iron latch, you push the heavy door open. It squeaks slightly as it scrapes on the floor and jamb."
);

const wellRoom = new Room(
  "Well Room",
  "In the centre of the room there's a waist-high marble circle around a deep, black hole. Over the hole is a wrought-iron crank with a rope curled around it. One end of the rope descends into the hole and into blackness that even your magically-enhanced vision can't penetrate. You're looking at a well.\n\nThe way out is via the door behind you, to the West."
);

const waitInWellText = new CyclicText(
  "The sound of your breathing seems horribly loud as you hang there, echoing back at you from the curved well walls. You try to quieten it.",
  "Your arms are aching terribly from supporting your own weight for such a long time. You hope you have the strength to climb out. And not to fall.",
  "The rope creaks slightly as you drift gently back and forth. Be as still as possible. As quiet."
);

const wellGraph = new OptionGraph(
  {
    id: "start",
    actions:
      "First you hop up onto the marble ledge. Then, leaning out with the aid of the iron crossbar, you reach for the rope. Your heart skips a beat as your first attempt to grab it misses, causing you to lurch queasily above the inky maw of the well shaft. You catch the rope on the second attempt and draw it towards you. Grabbing it with your other hand, you swing out over the pit, trying not to look down. The ironwork frame gives a creak but it holds. You carefully lower yourself down the rope, hand over hand, until your head drops below the level of the marbel parapet.",
    options: {
      "descend further": "descend",
      wait: waitInWellText,
      "climb out": "leave"
    }
  },
  {
    id: "descend",
    actions:
      "You slide further down the rope, deeper into the black embrace of the well shaft. The shadows thicken around you until, even with your enhanced vision, you can't make out the brick walls a few feet from your face. The top of the well is a coin-sized disc of grey directly overhead.",
    options: { "descend further": "bottom", wait: waitInWellText, "climb out": "leave" }
  },
  {
    id: "bottom",
    actions:
      "You climb down ever further, barely able to discern your progress now in the complete absence of light. There is only the rope, descending endlessly downwards in the dark. Could the shaft literally be bottomless? If a staircase can be endless then why not a well? You're just having this thought when suddenely, shockingly, your feet submerge in icily cold water.",
    options: {
      swim: () => "You're not that desperate, even now. You'd prefer to stay dry, thank you.",
      wait: waitInWellText,
      "climb out": "leave"
    }
  },
  {
    id: "leave",
    actions:
      "You haul yourself back up the rope, your small arms burning with the effort, and reach the top. With the help of the iron crossbar you maneouvre yourself over the marble lip surrounding the pit and back onto solid ground."
  }
);

const well = new Item.Builder()
  .withName("well")
  .withDescription(
    "The circular wall around the well shaft is constructed from gleaming white marble. At least, it would be gleaming if it weren't eneveloped by this Stygian darkness. A rope descends into the shaft before disappearing out of sight into the even greater pitch blackness lurking in its depths like some obliterating shroud. You wonder whether there's a bucket attached to the end.\n\nIt occurs to you that one could climb a little way down the rope, if one so wished, in order to hide from a pursuer."
  )
  .withVerbs(new Verb("hide", true, () => wellGraph.commence(), null, ["climb", "descend", "hang", "enter"]))
  .build();

wellRoom.addItems(carvedDoor, well);

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
    actions: () => {
      if (traversal === left) {
        return "The tunnel quickly turns to the right before becoming much narrower. At one point you have to turn sideways to squeeze through. When it opens out again there's a rickety wooden door to your right. The corridor curves to the right beyond the door.";
      } else if (traversal === right) {
        return "Rounding the bend, there's a rickety wooden door to your left. Ahead, the tunnel narrows.";
      } else {
        return "Emerging from the damp room, the narrow stone tunnel gets even tighter to your left and curves sharply to your right, almost doubling back behind you.";
      }
    },
    options: () => ({
      [traversal === left ? "round bend" : traversal === right ? "go back" : "round bend"]: {
        node: "crossroads",
        actions: () => setTraversal(up)
      },
      "open rickety door": { condition: () => !ricketyDoor.open, actions: () => ricketyDoor.getVerb("open").attempt() },
      "close rickety door": {
        condition: () => ricketyDoor.open,
        actions: () => ricketyDoor.getVerb("close").attempt()
      },
      "enter room": {
        condition: () => ricketyDoor.open,
        actions: [
          () => setTraversal(down),
          "Passing the open door, you slip into the small room.",
          () => goToRoom(mouldRoom)
        ],
        exit: true
      },
      [traversal === left ? "go back" : "narrow tunnel"]: {
        node: "tunnelDiode",
        actions: [
          () => setTraversal(up),
          "You squeeze into the narrow tunnel, holding your breath as you negotiate the most constricted part of it. After it widens out again, the tunnel curves to the left."
        ]
      }
    })
  },
  {
    id: "topRightPretzel",
    actions: () => {
      if (traversal === up) {
        return "Beyond the archway the tunnel becomes much less rough, instead suggesting grandeur, with interlocking octagonal and square floor tiles in a geometric pattern and elaborate mouldings near the floor and ceiling. Fluted half-columns line either side of the passage at regular intervals. You follow the corridor for some way until it turns to the left. It continues ahead of you.";
      } else {
        return "The passage twists again to the right, then stretches away, still lined with columns and baroque mouldings.";
      }
    },
    options: () => ({
      [traversal === up ? "continue" : "go back"]: { node: "topLeftPretzel", actions: () => setTraversal(down) },
      [traversal === up ? "go back" : "continue"]: { node: "tunnelDiode", actions: () => setTraversal(down) }
    })
  },
  {
    id: "topLeftPretzel",
    actions: () => {
      if (traversal === down) {
        return "The passage continues in the same fashion - all opulence and elegance. Did the Druids really build this? Or was this added later?\n\nYou follow the passage around to the left and come upon a carved wooden door set into the left wall. The tunnel continues ahead.";
      } else if (traversal == up) {
        return "The rough hewn tunnel abruptly loses its roughness as you traverse it, instead becoming ornate and opulent, with fluted columns and elaborate mouldings, geometric floor tiles and baroque flourishes. After a sharp turn to the left, you come upon a carved wooden door set into the right wall. The tunnel continues ahead.";
      } else {
        return "The corridor is just as grand as you remember, steeped as it may be in shadow, reminiscent of a magnificent palace or parliamentary building. You can go left or right from here.";
      }
    },
    options: {
      [traversal === down ? "continue" : traversal === up ? "go back" : "go left"]: {
        node: "crossroads",
        actions: () => setTraversal(left)
      },
      "open carved door": { condition: () => !carvedDoor.open, actions: () => carvedDoor.getVerb("open").attempt() },
      "close carved door": {
        condition: () => carvedDoor.open,
        actions: () => carvedDoor.getVerb("close").attempt()
      },
      "enter room": {
        condition: () => carvedDoor.open,
        actions: [
          () => setTraversal(left),
          "Passing the now open door, you cross the threshold into the room.",
          () => goToRoom(wellRoom)
        ],
        exit: true
      },
      [traversal === down ? "go back" : traversal === up ? "continue" : "go right"]: {
        node: "topRightPretzel",
        actions: () => setTraversal(down)
      }
    }
  },
  {
    id: "crossroads",
    actions: "placeholder"
  }
];

export const tunnelsGraph = new OptionGraph(...tunnelsNodes);

mouldRoom.setSouth(() => tunnelsGraph.commence("lowerPretzel"), ricketyDoor);
wellRoom.setWest(() => tunnelsGraph.commence("topLeftPretzel"), carvedDoor);
