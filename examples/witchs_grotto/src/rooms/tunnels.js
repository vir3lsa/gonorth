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
  Action,
  selectInventory,
  FixedSubjectEffects,
  Key,
  store,
  retrieve,
  gameOver,
  update
} from "../../../../lib/gonorth";
import { Ingredient } from "../magic/ingredient";
import { initCavern } from "./cavern";

const forward = "f";
const up = "up";
const down = "down";
const left = "left";
const right = "right";

let meetTheMonster;

// Don't need to store traversal direction is it's set when entering the graph.
let traversal = forward;
let tunnelsGraph;
let monster;

export const getMonster = () => {
  return monster;
};

export const initMonster = () => {
  monster = new Npc("the thing", "placeholder");
  return monster;
};

export const getTunnelsGraph = () => {
  return tunnelsGraph;
};

export const initTunnelsGraph = () => {
  initMonster();
  const cavern = initCavern();

  store("monsterLocation", "topLeftGaol");

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

  const barrelHideGraph = new OptionGraph("barrel", {
    id: "hide",
    actions:
      "You can see much of the dank chamber through gaps between the barrel's wooden staves. There's nothing there.",
    options: {
      wait: "hide",
      leave: {
        exit: true,
        actions: [() => forget("hiding"), "You lift the barrel and scramble out into the dimly lit room."]
      }
    }
  });

  rottenBarrel.addVerb(
    new Verb(
      "hide",
      true,
      [
        () => store("hiding", true),
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

  const cellKey = new Key(
    "rusty iron key",
    "It's a chunky iron key, veneered in brown rust. There's a large hoop at the back, presumably for hanging it from an equally large keyring.",
    true,
    0,
    [],
    ["metal"]
  );

  const oakDoor = new Door(
    "heavy oak door",
    "The door is solid and imposing looking. There's a heavy-duty lock of black iron, enhancing the impression it's designed to keep someone or something in.",
    false,
    true,
    "When you push on the door, it doesn't budge, so you give it a good barge with your shoulder. With a jolt, it breaks free of the jamb and swings inwards.",
    "You have to apply a lot of pressure to force the rusty key into the lock, but it fits snugly. Using both hands, you turn it a hundred and eighty degrees, producing a satisfying *clunk* from within.",
    ["cell"],
    cellKey
  );

  const oakDoorEffects = new FixedSubjectEffects(
    oakDoor,
    (item) => `The ${item.name} has no discernible effect on the door.`
  );

  oakDoorEffects.add(
    "Organic Dissolution Accelerator",
    true,
    () => {
      oakDoor.locked = false;
    },
    () => {
      oakDoor.open = true;
    },
    () => {
      oakDoor.description =
        "Thanks to the the potion and your shoe, there's not much left of the once sturdy door at all.";
    },
    () => {
      oakDoor.verbs.close.test = false;
    },
    () => {
      oakDoor.verbs.close.onFailure = "The door has been dissolved - it'll never close again.";
    },
    "Being *extremely* careful not to get any on yourself, you pour a good quantity of Organic Dissolution Accelerator down the door and stand back. The substance immediately goes to work, eating ravenously into the wood like a horde of angry termites. Within a couple of minutes there's not much left of the door at all; a good kick breaks a hole through it and a few more create a space you can slip through."
  );

  let cell = new Room(
    "Dank Cell",
    "The dank, cold room is little larger than a cupboard. The rough flagstones of the floor are damp and fuzzy with green moss. Attached to one stone-block wall is a pair of chains ending in heavy iron manacles. This is clearly a cell of some kind. You shiver at the thought of being kept in here.\n\nSome of the stone blocks making up the far right corner appear a little broken."
  );

  const manacles = new Item.Builder()
    .withName("manacles")
    .withDescription(
      "Large iron pins protrude from the wall and support heavy chains that end in shackles to be fastened about a person's wrists...or ankles, according to the whims of the gaoler. They're high enough up the wall that your feet probably wouldn't touch the ground if they were used on you, but perhaps that's the point."
    )
    .withAliases("shackles", "manacle", "shackle", "chain", "chains", "pin", "pins")
    .build();

  let stonesCondition = 3;

  const hole = new Item.Builder()
    .withName("hole in the wall")
    .withDescription(
      "The crumbling stone blocks have disintegrated enough to leave a narrow gap in the wall, big enough for a small animal to squeeze through. Or a small person."
    )
    .withAliases("gap")
    .withVerbs(
      new Verb.Builder()
        .withName("squeeze")
        .withAliases("go", "enter", "crawl", "duck")
        .withOnSuccess(
          new SequentialText(
            "You drop to all fours and tentatively put your head into the space between the stones, twisting sideways to allow your shoulders to squeeze through after. It's tight and you're afraid you might end up stuck. Your feet scrabble at the floor as they try to push the rest of your body through the hole. You still can't see anything; the wall must be a couple of feet thick at least and you've no idea what's beyond it.",
            "Another push and, suddenly, your head emerges from the hole into what seems like a wide open space after the confines of the narrow gap. Now your shoulders are through and, not long later, you scramble out of the hole with relief and get to your feet, brushing dust from your dress. Mother won't be happy when she sees the state of you."
          ),
          () => tunnelsGraph.commence("holeExit")
        )
        .build()
    )
    .build();

  const brokenStones = new Item.Builder()
    .withName("broken stones")
    .withDescription(
      "The solid stone blocks are much larger than ordinary bricks, but in this corner they appear to be crumbling and some of them have turned slightly, suggesting they might be loose."
    )
    .withAliases("crumbling", "turned", "hairline", "wall")
    .withVerbs(
      new Verb.Builder()
        .withName("break")
        .withAliases("smash", "push", "pull", "kick")
        .withOnSuccess(() => {
          stonesCondition--;
          if (stonesCondition >= 2) {
            return "You try to get a purchase on one of the twisted stones, but there's not enough to hook your fingers onto. Instead, you get down on the cold floor and push the stones with your feet. They shift a little bit.";
          } else if (stonesCondition === 1) {
            return "You kick at the broken blocks some more, trying not to break your toes. After giving one a good shove with your feet, they shift a little bit more, loose rubble falling down around them. There's a hairline gap visible through to the other side now.";
          } else if (stonesCondition === 0) {
            cell.addItem(hole);
            return "Getting back down onto the mossy slabstones, you give the crumbling wall one last two-footed kick and the broken stones give way and burst out into the space beyond. A shower of debris rains down onto your legs, causing a number of cuts and scratches, but you hardly notice.";
          } else {
            return "You've already created a decent hole in the wall - there's no need to collapse the whole cell.";
          }
        })
        .build()
    )
    .build();

  cell.addItems(oakDoor, manacles, brokenStones);

  const wellRoom = new Room(
    "Well Room",
    "In the centre of the room there's a waist-high marble circle around a deep, black hole. Over the hole is a wrought-iron crank with a rope curled around it. One end of the rope descends into the hole and into blackness that even your magically-enhanced vision can't penetrate. You're looking at a well.\n\nThe way out is via the door behind you, to the West."
  );

  let keyTaken = false;

  const waitInWellText = new CyclicText(
    "The sound of your breathing seems horribly loud as you hang there, echoing back at you from the curved well walls. You try to quieten it.",
    "Your arms are aching terribly from supporting your own weight for such a long time. You hope you have the strength to climb out. And not to fall.",
    "The rope creaks slightly as you drift gently back and forth. Be as still as possible. As quiet."
  );

  const wellGraph = new OptionGraph(
    "well",
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
        "search water": () => {
          if (keyTaken) {
            return "Fumble about beneath the water as you might, you find nothing but pebbles and mud.";
          } else {
            keyTaken = true;
            selectInventory().addItem(cellKey);
            return "Plunging your hand into the murky water whilst holding tightly to the rope with the other, you discover the it's only about a foot deep. Your feet are already wet, so you drop into the pool and crouch down, trying to keep your dress free from splashes. Rooting through the silt at the bottom, your hand closes around something cold and hard. You stand back up to inspect the find, and discover it's a rusty metal key.";
          }
        },
        wait: waitInWellText,
        "climb out": "leave"
      }
    },
    {
      id: "leave",
      actions: [
        () => forget("hiding"),
        "You haul yourself back up the rope, your small arms burning with the effort, and reach the top. With the help of the iron crossbar you maneouvre yourself over the marble lip surrounding the pit and back onto solid ground."
      ]
    }
  );

  const well = new Item.Builder()
    .withName("well")
    .withDescription(
      "The circular wall around the well shaft is constructed from gleaming white marble. At least, it would be gleaming if it weren't eneveloped by this Stygian darkness. A rope descends into the shaft before disappearing out of sight into the even greater pitch blackness lurking in its depths like some obliterating shroud. You wonder whether there's a bucket attached to the end.\n\nIt occurs to you that one could climb a little way down the rope, if one so wished, in order to hide from a pursuer."
    )
    .withVerbs(
      new Verb("hide", true, [() => store("hiding", true), () => wellGraph.commence()], null, [
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
        "open rickety door": {
          condition: () => !ricketyDoor.open,
          actions: () => ricketyDoor.getVerb("open").attempt(ricketyDoor)
        },
        "close rickety door": {
          condition: () => ricketyDoor.open,
          actions: () => ricketyDoor.getVerb("close").attempt(ricketyDoor)
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
        "open carved door": {
          condition: () => !carvedDoor.open,
          actions: () => carvedDoor.getVerb("open").attempt(carvedDoor)
        },
        "close carved door": {
          condition: () => carvedDoor.open,
          actions: () => carvedDoor.getVerb("close").attempt(carvedDoor)
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
          return `You ${
            retrieve("beingChased") ? "sprint" : "trudge"
          } back along the passage until you return to the vaulted crossroads you passed earlier. It seems somehow less impressive now. \n\nPaths go off in all directions.`;
        } else if (traversal === left) {
          return "The richly decorated corridor turns to the right, then takes on a cathedral like grandiosity, with high, vaulted ceilings. A little further on you reach a crossroads, the meeting point of the four paths capped by a hemispherical dome. Despite the grandeur, it's still so dark you wouldn't be able to see past your nose if it weren't for the potion.";
        } else if (traversal === right) {
          return `${
            retrieve("beingChased") ? "Dashing round" : "Turning"
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
          return `Along the corridor, the ceiling drops lower and any sign of elegance is quickly left behind. The stone tunnel veers left then presents you with a flight of steep, worn steps leading down into the deeper darkness below. You ${
            retrieve("beingChased")
              ? "hurtle down them, praying you don't"
              : "take them carefully, one at a time, making sure not to"
          } slip on the polished-smooth treads. It would be a long, painful way down. As you descend, the air becomes perceptibly colder and a certain sense of dread begins to pervade your thoughts. What might be lurking down here, lying in wait? When you eventually reach the bottom, there's a sharp left turn ahead of you.`;
        } else if (traversal === up) {
          if (retrieve("beingChased")) {
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
      actions: () =>
        new SequentialText(
          `The tunnel's floor slopes slightly to the left making ${
            retrieve("beingChased") ? "running" : "walking"
          } along it hard on your feet. A little further along, the whole passage seems to tilt to the left, its rectangular cross-section leaning crazily away from the vertical, giving you the feeling that you're on some great subterranean ship on choppy waters. You follow a dog-leg to the right, then shortly back to the left, before the tunnel dives downwards, taking you deeper.`,
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
        () => {
          if (retrieve("metTheMonster") && !retrieve("beingChased")) {
            return "Nervously, you peek around the corner, praying that monstrosity won't be lurking where you found it the first time. Well...you don't see it. Maybe that means it's gone?";
          } else if (retrieve("metTheMonster") && retrieve("beingChased")) {
            return "You fly round the bend and start off along the tunnel, towards the sound of running water.";
          } else {
            meetTheMonster.manualCommence();
            store("metTheMonster", true);
            return "Beyond the bend the corridor stretches away into the darkness. From somewhere not too far away there's the sound of dripping and trickling water.";
          }
        }
      ],
      options: () => ({
        [traversal === right ? "continue forward" : "go back"]: {
          node: "topLeftGaol",
          actions: () => {
            setTraversal(down);
            if (retrieve("metTheMonster")) {
              return "You creep along the tunnel, half expecting to hear those horrible wails again at any moment. To your immense relief, they don't come. As you progress, the sound of running water becomes louder.";
            }
          }
        },
        [traversal === right ? "back up stairs" : "go round corner"]: {
          node: "stairs",
          actions: () => setTraversal(up)
        }
      })
    },
    {
      id: "topLeftGaol",
      actions: () => {
        if (traversal === down) {
          return "The corridor twists to the right and immediately branches. A long tunnel stretches away to the left, whilst the one ahead appears to be partially submerged in water.";
        }
      },
      options: () => ({
        [traversal === down ? "back" : "left bend"]: "meetTheMonster",
        "long corridor": { node: "topGaol", actions: () => setTraversal(right) },
        "submerged tunnel": { node: "leftGaol", actions: () => setTraversal(down) }
      })
    },
    {
      id: "topGaol",
      actions: () => {
        if (traversal === right) {
          return "You creep fearfully along the long the corridor, trying not to make a sound. Even so, every scrape of your feet on the rough stone reverberates sickeningly up and down the tunnel. The darkness is nearly total, forcing you to feel your way down the right-hand wall. Soon, the wall falls away, revealing a passage leading to the right. The corridor continues on ahead.";
        }
      },
      options: () => ({
        [traversal === right ? "right" : traversal === left ? "left" : "back"]: {
          node: "middleGaol",
          actions: () => setTraversal(down)
        },
        [traversal === right ? "forward" : traversal === left ? "back" : "right"]: {
          node: "topRightGaol",
          actions: () => setTraversal(right)
        },
        [traversal === right ? "back" : traversal === left ? "forward" : "left"]: {
          node: "topLeftGaol",
          actions: () => setTraversal(left)
        }
      })
    },
    {
      id: "leftGaol",
      actions: () => {
        if (direction === down) {
          return "Placing your feet carefully, lest there be an unexpected change in depth, you slosh slowly along the flooded tunnel. The water is inky black and freezing cold - it's about up to your ankles. You really hope it doesn't get any deeper. After a little way the tunnel turns to the left. Back the way you came, the tunnel forks forwards and right.";
        } else {
          return "You step into the cold water and round the bend. Placing your feet carefully, lest there be an unexpected change in depth, you slosh slowly along the flooded tunnel. The water is inky black and freezing cold - it's about up to your ankles. You really hope it doesn't get any deeper. Ahead, the tunnel continues, and branches to the right.";
        }
      },
      options: () => ({
        [direction === down ? "round bend" : "go back"]: { node: "bottomGaol", actions: () => setTraversal(right) },
        [direction === down ? "back and right" : "right"]: { node: "topGaol", actions: () => setTraversal(right) },
        [direction === down ? "back and straight on" : "straight on"]: {
          node: "topLeftGaol",
          actions: () => setTraversal(left)
        }
      })
    },
    {
      id: "middleGaol",
      actions: () =>
        `The flagstones of this passage are broken and treacherous underfoot, tilting alarmingly as you step on them, creating loud echoes as the ancient stones scrape and knock together. You cringe inwardly, certain anything nearby must be aware of your precise location.\n\nThere's a heavy oak door to your ${
          direction === down ? left : right
        }. Not far beyond, the passage branches left and right. Behind you, there's a similar fork.`,
      options: () => ({
        "unlock oak door": {
          condition: () => oakDoor.locked,
          inventoryAction: (item) => {
            if (item instanceof Key) {
              return oakDoor.getVerb("unlock").attempt(oakDoor, item);
            } else {
              return oakDoorEffects.apply(item);
            }
          }
        },
        "open oak door": { condition: () => !oakDoor.open, actions: () => oakDoor.getVerb("open").attempt(oakDoor) },
        "close oak door": {
          condition: () => oakDoor.open,
          actions: () => oakDoor.getVerb("close").attempt(oakDoor)
        },
        "enter room": {
          condition: () => oakDoor.open,
          actions: () => [setTraversal(right), "You step into the dark chamber beyond the wooden door."],
          room: cell
        },
        [direction === down ? "left" : "back and left"]: "lowerRightRockfall",
        [direction === down ? "right" : "back and right"]: { node: "bottomGaol", actions: () => setTraversal(left) },
        [direction === down ? "back and left" : "left"]: { node: "topGaol", actions: () => setTraversal(left) },
        [direction === down ? "back and right" : "right"]: { node: "topRightGaol", actions: () => setTraversal(right) }
      })
    },
    {
      id: "topRightGaol"
    },
    {
      id: "lowerRightRockfall"
    },
    {
      id: "bottomGaol"
    },
    {
      id: "holeExit",
      actions: () =>
        "You're slightly dismayed to discover you're in another gloomy stone corridor - presumably still part of the gaol? A cave-in blocks the way ahead, but a side passage leads off to the right. In the other direction, the corridor disappears off around a bend to the right.",
      options: {
        "side passage": {
          actions: new SequentialText(
            "As you set off along the adjoining passage, you once again hear the sound of water. Rather than dripping, though, this is more of a gurgling, tinkling sound, like that of a stream running down a hillside. You round a bend and the sound becomes louder.",
            "The obviously artificial passage soon opens out into an uneven rocky tunnel that looks like a natural formation. The source of the sound becomes apparent when you notice water gushing from beneath a boulder and proceeding along the tunnel, splashing and dancing over the rocks in a little stream. You continue following it, and the tunnel soon opens out into a much larger cavern."
          ),
          room: cavern
        },
        "round bend": {
          actions:
            "Beyond the bend you're met abruptly by another ceiling-high pile of rubble blocking the way. This whole place feels rather unstable and you're horribly aware of the enormous weight of rock hanging a few feet above your head. You've never particularly suffured from claustrophobia, but being afraid of getting buried alive or crushed to death in this crumbling labyrinth doesn't seem altogether irrational. Turning, you retrace your steps back to the hole."
        },
        "back through hole": {
          actions:
            "Reluctantly, you get back down on your belly and wriggle back into the hole you made. Perhaps you widened it the first time through, but getting through doesn't seem quite as difficult this time.",
          room: cell
        }
      }
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
        if (retrieve("beingChased")) {
          return beingChasedText;
        }
      }, false)
    );

    node.actions = actions;
  });

  tunnelsGraph = new OptionGraph("tunnels", ...tunnelsNodes);

  meetTheMonster = new Event(
    "meet the monster",
    [
      () => store("beingChased", true),
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
    if (tunnelsGraph.currentNode && retrieve("monsterLocation") === tunnelsGraph.currentNode.id) {
      return [
        'Suddenly, the shadows seem to loom up around you and you find yourself staring into the cold, lifeless eyes of the wraith pursuing you. "So it does have eyes," you have time to think, before the shadows envelop you and everything becomes cold and dark.',
        gameOver
      ];
    } else if (retrieve("monsterLocation") === selectRoom().name && !retrieve("hiding")) {
      return [
        "Suddenly, it's in the room with you. A tall, black spectre of undeniable malace, it bears down on you immediately, like a predator pouncing on its quarry. Your legs fail you and you crash to the floor as the shadows deepen and everything goes dark.",
        gameOver
      ];
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
      const playerLocation = selectRoom().name === "Cellar Nook" ? tunnelsGraph.currentNode.id : selectRoom().name;

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

      const pathToPlayer = findPlayer(retrieve("monsterLocation"));

      if (!retrieve("hiding") && (!pathToPlayer || !pathToPlayer.length)) {
        // The monster's in the same location as the player - will be picked up by encounter
        return;
      }

      const newMonsterLocation = pathToPlayer.length && pathToPlayer[0];
      let monsterLocationName;

      if (newMonsterLocation instanceof Room) {
        // TODO What about the door?
        update("monsterLocation", newMonsterLocation.name);
        monsterLocationName = newMonsterLocation.name;
        monster.container.removeItem(monster);
        newMonsterLocation.addItem(monster);
      } else if (newMonsterLocation) {
        update("monsterLocation", newMonsterLocation);
        monsterLocationName = tunnelsGraph.getNode(newMonsterLocation).name;
      }

      const distanceToPlayer = pathToPlayer.length ? pathToPlayer.length - 1 : 0;
      const playerInRoom = selectRoom().name !== "Cellar Nook"; // If in the Cellar Nook, the player's actually in the tunnels.

      if (playerInRoom && distanceToPlayer === 1) {
        return outsideRoomText;
      } else if (playerInRoom && distanceToPlayer) {
        return nearbyText.next(monsterLocationName, true);
      } else if (playerInRoom && retrieve("hiding")) {
        searchingCount++; // The monster's looking for the player in the room.
        if (searchingCount <= 2) {
          return seekingInRoomText;
        } else {
          searchingCount = 0;
          forget("beingChased"); // TODO Add forget function
          update("monsterLocation", "bottomRightGaol");
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
    () => retrieve("beingChased"),
    4000,
    TIMEOUT_MILLIS
  );
  monsterChase.recurring = true;
  addEvent(monsterChase);

  mouldRoom.setSouth(() => tunnelsGraph.commence("lowerPretzel"), ricketyDoor);
  wellRoom.setWest(() => tunnelsGraph.commence("topLeftPretzel"), carvedDoor);

  return tunnelsGraph;
};
