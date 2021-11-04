import { newItem, Item } from "@gonorth";
import {
  Trial,
  grassTerrain,
  menhirTerrain,
  riverTerrain,
  ditchTerrain,
  airTerrain,
  yourSigilTerrain,
  tutorSigilTerrain
} from "./trial";

export const firstTrial = new Trial(
  "First Trial",
  "Before you lies a small clearing somewhere in the heart of the Endless Woods. Running across the clearing from East to West is a gurgling and splashing brook. There's no bridge across it that you can see. On the North side of the brook a ditch has been carved into the ground from the Northern edge of the clearing, down to the river, such that it's filled with water, forming a barrier separating the two quarters of the arena North of the brook.\n\nThree tall stone monoliths stand like silent sentries in the clearing - one near each corner of the roughly square space.\n\nThe tutor's sigil is on the West side of the ditch, in the North West corner of the clearing.",
  {
    2: {
      1: {
        5: grassTerrain,
        4: grassTerrain,
        3: riverTerrain,
        2: riverTerrain,
        1: grassTerrain
      },
      2: {
        5: grassTerrain,
        4: grassTerrain,
        3: riverTerrain,
        2: riverTerrain,
        1: grassTerrain
      },
      3: {
        5: ditchTerrain,
        4: ditchTerrain,
        3: riverTerrain,
        2: riverTerrain,
        1: grassTerrain
      },
      4: {
        5: ditchTerrain,
        4: ditchTerrain,
        3: riverTerrain,
        2: riverTerrain,
        1: grassTerrain
      },
      5: {
        5: grassTerrain,
        4: grassTerrain,
        3: riverTerrain,
        2: riverTerrain,
        1: grassTerrain
      }
    },
    3: {
      1: {
        5: airTerrain,
        4: menhirTerrain,
        3: airTerrain,
        2: airTerrain,
        1: yourSigilTerrain
      },
      2: {
        5: tutorSigilTerrain,
        4: airTerrain,
        3: airTerrain,
        2: airTerrain,
        1: airTerrain
      },
      3: {
        5: airTerrain,
        4: airTerrain,
        3: airTerrain,
        2: airTerrain,
        1: airTerrain
      },
      4: {
        5: airTerrain,
        4: airTerrain,
        3: airTerrain,
        2: airTerrain,
        1: airTerrain
      },
      5: {
        5: menhirTerrain,
        4: airTerrain,
        3: airTerrain,
        2: airTerrain,
        1: menhirTerrain
      }
    }
  },
  [1, 1, 3]
);

const southeastMenhir = newItem({
  name: "southeast menhir",
  description:
    "Like its partner across the river, it must be thirty feet tall, made of rough grey rock and shaped vaguely like an elongated egg stood upright, though the lower extent is still buried beneath the earth. At ground level it has four relatively flat sides, though it becomes more rounded higher up.\n\nThere's something quite uncanny about it - the fact it rose up just moments ago, as if the ground were experiencing a particularly sudden and accelerated spurt of teething, probably has something to do with it.",
  aliases: ["monolith", "obelisk", "stone", "rock"]
});

const northeastMenhir = newItem({
  name: "northeast menhir",
  description:
    "The Easternmost menhir on the Northern side of the brook is perhaps a shade taller than its Southern partner, but still around thirty feet high. There are swirling patterns higher up, you notice, lacing the stone with curving lines, whorls and spirals. The designs peter out before ground level, leaving the four faces relatively flat and featureless.",
  aliases: ["monolith", "obelisk", "stone", "rock"]
});

const northwestMenhir = newItem({
  name: "northwest menhir",
  description:
    "The North-West monolith, nearest the tutor's sigil, is perhaps the smallest of the three, appearing slightly shorter and squatter, though no less imposing. Like its counterparts, it's roughly square at the base before rounding and tapering towards the summit.",
  aliases: ["monolith", "obelisk", "stone", "rock"]
});

const tutorSigil = newItem({
  name: "tutor's sigil",
  description:
    "The tutor's sigil depicts a peregrine in flight, ringed by double concentric circles. It appears to burn with lime green fire, though the dry grass beneath it is never consumed.",
  aliases: ["mark", "sign", "goal", "exit", "peregrine", "falcon", "bird"]
});

const yourSigil = newItem({
  name: "applicant's sigil",
  description:
    "Applicants of the Order receive the relatively nondescript sigil of a silver star. Its unsubstantial outline sparkles and wavers just above the ground like rippling water.",
  aliases: ["mark", "sign", "start", "applicant", "star"]
});

const river = new Item.Builder()
  .withName("river")
  .withDescription(
    "It emerges from the trees and undergrowth at the Eastern edge of the clearing and cuts a nearly straight path across the centre, before diving back into the thick shadows beneath the beech and hawthorn. It's relatively fast-flowing and splashes and gurgles its way around scattered rocks and down small drops as it cuts deeper on its way Westward."
  )
  .withAliases("brook", "stream", "water")
  .build();

const ditch = new Item.Builder()
  .withName("ditch")
  .withDescription(
    "a wide dyke has sunk into the clearing North of the river, branching off the stream's channel from near the centre of the arena and stretching North towards the boundary of trees. It's filled with water from the brook."
  )
  .withAliases("dyke", "pit", "barrier", "trench")
  .build();

firstTrial.addItems(southeastMenhir, northeastMenhir, northwestMenhir, tutorSigil, yourSigil, river, ditch);
