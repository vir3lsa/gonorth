import {
  OptionGraph,
  selectRoom,
  SequentialText,
  Room,
  Item,
  Door,
  Verb,
  CyclicText,
  Npc,
  Event,
  TIMEOUT_TURNS,
  addEvent,
  TIMEOUT_MILLIS,
  RandomText,
  Action
} from "../../../../lib/gonorth";
import { Ingredient } from "../magic/ingredient";

const forward = "f";
const reverse = "r";

const up = "up";
const down = "down";
const left = "left";
const right = "right";

let monsterLocation = "topLeftJail";

let meetTheMonster;
let beingChased = false;
let hiding = false;
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
    leave: {
      exit: true,
      actions: [() => (hiding = false), "You lift the barrel and scramble out into the dimly lit room."]
    }
  }
});

rottenBarrel.addVerb(
  new Verb(
    "hide",
    true,
    [
      () => (hiding = true),
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
    actions: [
      () => (hiding = false),
      "You haul yourself back up the rope, your small arms burning with the effort, and reach the top. With the help of the iron crossbar you maneouvre yourself over the marble lip surrounding the pit and back onto solid ground."
    ]
  }
);

export const monster = new Npc("the thing", "placeholder");

const well = new Item.Builder()
  .withName("well")
  .withDescription(
    "The circular wall around the well shaft is constructed from gleaming white marble. At least, it would be gleaming if it weren't eneveloped by this Stygian darkness. A rope descends into the shaft before disappearing out of sight into the even greater pitch blackness lurking in its depths like some obliterating shroud. You wonder whether there's a bucket attached to the end.\n\nIt occurs to you that one could climb a little way down the rope, if one so wished, in order to hide from a pursuer."
  )
  .withVerbs(
    new Verb("hide", true, [() => (hiding = true), () => wellGraph.commence()], null, [
      "climb",
      "descend",
      "hang",
      "enter"
    ])
  )
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
    name: "sloping tunnel",
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
    name: "sloping tunnel",
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
    name: "vertical drop-off",
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
    name: "vertical wall",
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
    name: "narrow passage",
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
        actions: [() => setTraversal(down), "Passing the open door, you slip into the small room."],
        room: mouldRoom
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
    name: "grand corridor",
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
    name: "grand passage",
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
        actions: [() => setTraversal(left), "Passing the now open door, you cross the threshold into the room."],
        room: wellRoom
      },
      [traversal === down ? "go back" : traversal === up ? "continue" : "go right"]: {
        node: "topRightPretzel",
        actions: () => setTraversal(down)
      }
    }
  },
  {
    id: "crossroads",
    name: "crossroads",
    actions: () => {
      if (traversal === up) {
        return "Beyond the bend, the roof of the passage that was previously a few feet above your head abruptly lifts to twice the height, fantastic vaulted spaces lending a cathedral-like air. You soon come upon a crossroads, the meeting point of the four paths capped by a hemispherical dome. Despite the grandeur, it's still as dark as a crypt down here.";
      } else if (traversal === down) {
        return "You trudge back along the passage until you return to the vaulted crossroads you passed earlier. It seems somehow less impressive now. \n\nPaths go off in all directions.";
      } else if (traversal === left) {
        return "The richly decorated corridor turns to the right, then takes on a cathedral like grandiosity, with high, vaulted ceilings. A little further on you reach a crossroads, the meeting point of the four paths capped by a hemispherical dome. Despite the grandeur, it's still so dark you wouldn't be able to see past your nose if it weren't for the potion.";
      } else if (traversal === right) {
        return `${
          beingChased ? "Dashing round" : "Turning"
        } the corner, you follow the passage back until its ceiling lifts away and you find yourself back at the cathedral-like crossroads beneath the stone dome.`;
      }
    },
    options: () => ({
      [traversal === up
        ? "go left"
        : traversal === left
        ? "straight on"
        : traversal === right
        ? "go back"
        : "go right"]: { node: "stairs", actions: () => setTraversal(down) },
      [traversal === up
        ? "straight on"
        : traversal === left
        ? "go right"
        : traversal === right
        ? "go left"
        : "go back"]: { node: "deadEnd", actions: () => setTraversal(up) },
      [traversal === up
        ? "go right"
        : traversal === left
        ? "go back"
        : traversal === right
        ? "straight on"
        : "go left"]: { node: "topLeftPretzel", actions: () => setTraversal(up) },
      [traversal === up
        ? "go back"
        : traversal === left
        ? "go left"
        : traversal === right
        ? "go right"
        : "straight on"]: { node: "lowerPretzel", actions: () => setTraversal(right) }
    })
  },
  {
    id: "stairs",
    name: "steps",
    actions: () => {
      if (traversal === down) {
        return "Along the corridor, the ceiling drops lower and any sign of elegance is quickly left behind. The stone tunnel veers left then presents you with a flight of steep, worn steps leading down into the deeper darkness below. You take them carefully, one at a time, making sure not to slip on the polished-smooth treads. It would be a long, painful way down. As you descend, the air becomes perceptibly colder and a certain sense of dread begins to pervade your thoughts. What might be lurking down here, lying in wait? When you eventually reach the bottom, there's a sharp left turn ahead of you.";
      } else if (traversal === up) {
        if (beingChased) {
          return "You fly round the bend in a mad panic and sprint towards the steep stone steps. A bigger person would take them two at a time, but you have to make do with one, much to your frustration and horror. Even so, you bound up the stairs at an unwise pace, heedless of the danger of slipping, your mind on the much greater danger of the thing pursuing you. You reach the top, and a corner to the right.";
        } else {
          return "placeholder";
        }
      }
    },
    options: () => ({
      [traversal === down ? "go round corner" : "go back down stairs"]: {
        node: "meetTheMonster",
        actions: () => setTraversal(right)
      },
      [traversal === down ? "go back up stairs" : "go round corner"]: {
        node: "crossroads",
        actions: () => setTraversal(right)
      }
    })
  },
  {
    id: "deadEnd",
    name: "blocked tunnel",
    actions: new SequentialText(
      "The tunnel's floor slopes slightly to the left making walking along it hard on your feet. A little further along, the whole passage seems to tilt to the left, its rectangular cross-section leaning crazily away from the vertical, giving you the feeling that you're on some great subterranean ship on choppy waters. You follow a dog-leg to the right, then shortly back to the left, before the tunnel dives downwards, taking you deeper.",
      "Abruptly, you're forced to stop. The way forward is blocked by a ceiling-high pile of rubble and boulder. The tunnel must have collapsed in on itself who knows how many years ago. There's no hope of continuing in this direction."
    ),
    options: {
      "go back": {
        node: "crossroads",
        actions: () => setTraversal(down)
      }
    }
  },
  {
    id: "meetTheMonster",
    name: "dank tunnel",
    actions: [
      () => meetTheMonster.manualCommence(),
      "Beyond the bend the corridor stretches away into the darkness. From somewhere not too far away there's the sound of dripping and trickling water."
    ],
    options: () => ({
      [traversal === right ? "continue forward" : "go back"]: {
        node: "topLeftJail",
        actions: () => setTraversal(down)
      },
      [traversal === right ? "back up stairs" : "go round corner"]: { node: "stairs", actions: () => setTraversal(up) }
    })
  },
  {
    id: "topLeftJail",
    options: () => ({
      back: "meetTheMonster"
    })
  }
];

const beingChasedText = new RandomText(
  "You run for your life.",
  "Your shoes clatter noisily on the stone floor, echoing down the subterranean halls as you sprint to safety.",
  "Your lungs burn as you race onwards.",
  "Barely stopping to think, escape the only thing on your mind, you dash forwards.",
  "You charge onward, half expecting to feel icy fingers grab you at any moment."
);

// Add action to each node that prepends extra text when you're being chased.
tunnelsNodes.forEach((node) => {
  let actions = node.actions;

  if (!actions) {
    return;
  }

  actions = Array.isArray(actions) ? actions : [actions];
  actions.unshift(
    new Action(() => {
      if (beingChased) {
        return beingChasedText;
      }
    }, false)
  );

  node.actions = actions;
});

export const tunnelsGraph = new OptionGraph(...tunnelsNodes);

meetTheMonster = new Event(
  "meet the monster",
  [
    () => (beingChased = true),
    new SequentialText(
      "You strain your eyes to make out details in the subfusc illumination, sure that there's a...shape...a little way down the tunnel from you. It's too tall to be a person; it stretches right the way from floor to ceiling - a good eight feet. It's narrow; if it *were* a person, they would have to be extremely tall and thin. The shape of the outline gives the impression of a hooded cloak - wide at the feet, narrowing at the neck, before billowing out again around the head. The feeling of dread is almost palpable now and it's directed towards that...thing...blocking the tunnel in front of you. It hasn't moved since you began staring at it...but...you have the horrible sense that it's staring back at you, assessing, waiting. Perhaps if you stay very still...",
      "Without a sound, it starts moving towards you, gliding inhumanly down the tunnel. Terror seizes you - there are just seconds before the thing will be upon you. You need to run. Now!"
    )
  ],
  false,
  0,
  TIMEOUT_TURNS
);

const monsterEncounter = () => {
  if (tunnelsGraph.currentNode && monsterLocation === tunnelsGraph.currentNode.id) {
    return 'Suddenly, the shadows seem to loom up around you and you find yourself staring into the cold, lifeless eyes of the thing pursuing you. "So it does have eyes," you have time to think, before the shadows envelop you and everything becomes cold and dark.'; // TODO Game-over state
  } else if (monsterLocation === selectRoom() && !hiding) {
    return "Suddenly, it's in the room with you. A tall, black spectre of undeniable malace, it bears down on you immediately, like a predator pouncing on its quarry. Your legs fail you and you crash to the floor as the shadows deepen and everything goes dark."; // TODO Game-over state
  }
};

monster.addEncounter(monsterEncounter);

const rightBehingYouText = new CyclicText(
  "It's right behind you! Don't stop!",
  "The thing's hot on your tail, gliding menacingly after you.",
  "You risk a glance over your shoulder and immediately regret it. It's closer than you dared believe.",
  "The baleful spectre's almost close enough to reach out and touch you. Run faster!",
  "A twisted moan from directly behind you almost makes you fall over in fright."
);

const nearbyText = new CyclicText(
  (location, playerInRoom) =>
    `Another awful moaning cry echoes from somewhere ${
      playerInRoom ? "nearby" : "behind you"
    }. Sounds like it's coming from the ${location}.`,
  `Strain your ears as you might, you don't hear anything coming. You don't believe for a second that you're safe, though.`,
  (location) => `Whimpering cries emanate from the direction of the ${location}. It's still coming.`,
  (location, playerInRoom) =>
    `${
      playerInRoom ? "You strain your eyes for signs of the thing pursuing you" : "You glance back over your shoulder"
    } but can't make much out in the gloom. Low, twisted moans tell you you're not safe yet, though.`,
  (location) => `An ear-splitting inhuman shriek echoes off the stones. Did that come from the ${location}?`
);

const outsideRoomText = new CyclicText(
  "A heart-stopping wail from just outside the room announces the thing's imminent arrival. Find somewhere to hide before it's too late.",
  "The shadow thing is right outside the room. Hide! Anywhere!",
  "You've got literally seconds before that awful demonic nightmare gets here. You'll be a sitting duck standing out in the open."
);

const seekingInRoomText = new CyclicText(
  "You know it's looking for you. Despite not being able to see it, and its hateful wailing having presently ceased, you can *feel* it somehow - a malign presence invading the very air around you.",
  "Holding your breath, you pray it won't hear you. Your hammering heart will surely give you away.",
  "It's still there, searching for you. Just. Go. Away.",
  "Won't it give up? What if it finds you? You try not to think about it.",
  "You daren't breathe, lest you give away your hiding place. It's still out there."
);

let firstChase = true;
let searchingCount = 0;
const monsterChase = new Event(
  "monster chase",
  () => {
    const playerLocation = selectRoom().name === "Cellar Nook" ? tunnelsGraph.currentNode.id : selectRoom();

    const triedNodes = [];

    const findPlayer = (location, path = []) => {
      if (location === playerLocation) {
        return path;
      }

      if (triedNodes.includes(location)) {
        return;
      } else {
        triedNodes.push(location);
      }

      let node = tunnelsGraph.getNode(location);
      if (node && node.options) {
        const options = typeof node.options === "function" ? node.options() : node.options;
        return Object.values(options).reduce((result, option) => {
          let searchResult;

          if (typeof option === "string") {
            searchResult = findPlayer(option, [...path, option]);
          } else if (option.node) {
            searchResult = findPlayer(option.node, [...path, option.node]);
          } else if (option.room) {
            searchResult = findPlayer(option.room, [...path, option.room]);
          }

          return !result || (searchResult && searchResult.length < result.length) ? searchResult : result;
        }, null);
      }
    };

    const pathToPlayer = findPlayer(monsterLocation);

    if (!hiding && (!pathToPlayer || !pathToPlayer.length)) {
      // The monster's in the same location as the player - will be picked up by encounter
      return;
    }

    const newMonsterLocation = pathToPlayer.length && pathToPlayer[0];
    let monsterLocationName;

    if (newMonsterLocation instanceof Room) {
      // TODO What about the door?
      monsterLocation = newMonsterLocation;
      monsterLocationName = monsterLocation.name;
      monster.container.removeItem(monster);
      newMonsterLocation.addItem(monster);
    } else if (newMonsterLocation) {
      monsterLocation = pathToPlayer[0];
      monsterLocationName = tunnelsGraph.getNode(monsterLocation).name;
    }

    const distanceToPlayer = pathToPlayer.length ? pathToPlayer.length - 1 : 0;
    const playerInRoom = selectRoom().name !== "Cellar Nook"; // If in the Cellar Nook, the player's actually in the tunnels.

    if (playerInRoom && distanceToPlayer === 1) {
      return outsideRoomText;
    } else if (playerInRoom && distanceToPlayer) {
      return nearbyText.next(monsterLocationName, true);
    } else if (playerInRoom && hiding) {
      searchingCount++; // The monster's looking for the player in the room.
      if (searchingCount <= 2) {
        return seekingInRoomText;
      } else {
        searchingCount = 0;
        beingChased = false;
        monsterLocation = "bottomRightJail";
        monster.container.removeItem(monster); // Is it sufficient to just do this? Or do I need to put the monster back in the Cellar Nook?
        return "The sickening sense of dread pervading your mind slowly recedes. The spectral pursuer must have finally given up its hunt for you and left. The coast is clear, or so you hope.";
      }
    }
    if (distanceToPlayer && firstChase) {
      firstChase = false;
      return "Behind you there's a sound that makes your blood freeze. Like a cry of agony, but played in reverse on a broken casette recorder, slowing down and speeding up at random. Inhuman, otherwordly and dripping demonic malice, it makes your hair stand on end and your already hammering heart try to jump out of your chest.";
    } else if (distanceToPlayer === 1) {
      return rightBehingYouText;
    } else if (distanceToPlayer) {
      return nearbyText.next(monsterLocationName);
    } else {
      return monsterEncounter();
    }
  },
  () => beingChased,
  4000,
  TIMEOUT_MILLIS
);
monsterChase.recurring = true;
addEvent(monsterChase);

mouldRoom.setSouth(() => tunnelsGraph.commence("lowerPretzel"), ricketyDoor);
wellRoom.setWest(() => tunnelsGraph.commence("topLeftPretzel"), carvedDoor);
