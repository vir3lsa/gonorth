import { Room, Verb, addKeyword, newItem, Item } from "@gonorth";
import { Terrain, Trial } from "./trial";

export const firstTrial = new Room(
  "First Trial",
  "Before you lies a small clearing somewhere in the heart of the Endless Woods. Running across the clearing from East to West is a gurgling and splashing brook. There's no bridge across it that you can see. On the North side of the brook a ditch has been carved into the ground from the Northern edge of the clearing, down to the river, such that it's filled with water, forming a barrier separating the two quarters of the arena North of the brook.\n\nThree tall stone monoliths stand like silent sentries in the clearing - one near each corner of the roughly square space.\n\nThe tutor's sigil is on the West side of the ditch, in the North West corner of the clearing."
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

const grassTerrain = new Terrain("grass", true);
const riverTerrain = new Terrain("river", false);
const ditchTerrain = new Terrain("ditch", false);
const menhirTerrain = new Terrain("menhir", false);

const trial = new Trial(
  {
    1: {
      5: { terrain: grassTerrain },
      4: { terrain: menhirTerrain, item: northwestMenhir },
      3: { terrain: riverTerrain },
      2: { terrain: riverTerrain },
      1: { terrain: grassTerrain, item: yourSigil }
    },
    2: {
      5: { terrain: grassTerrain, item: tutorSigil },
      4: { terrain: grassTerrain },
      3: { terrain: riverTerrain },
      2: { terrain: riverTerrain },
      1: { terrain: grassTerrain }
    },
    3: {
      5: { terrain: ditchTerrain },
      4: { terrain: ditchTerrain },
      3: { terrain: riverTerrain },
      2: { terrain: riverTerrain },
      1: { terrain: grassTerrain }
    },
    4: {
      5: { terrain: ditchTerrain },
      4: { terrain: ditchTerrain },
      3: { terrain: riverTerrain },
      2: { terrain: riverTerrain },
      1: { terrain: grassTerrain }
    },
    5: {
      5: { terrain: menhirTerrain, item: northeastMenhir },
      4: { terrain: grassTerrain },
      3: { terrain: riverTerrain },
      2: { terrain: riverTerrain },
      1: { terrain: menhirTerrain, item: southeastMenhir }
    }
  },
  [1, 1]
);

setTimeout(() => {
  addKeyword(new Verb("North", true, () => trial.goNorth(), null, ["n", "forward", "straight on"], true));
  addKeyword(
    new Verb("South", true, () => trial.goSouth(), null, ["s", "backward", "backwards", "back", "reverse"], true)
  );
  addKeyword(new Verb("East", true, () => trial.goEast(), null, ["e", "right", "r"], true));
  addKeyword(new Verb("West", true, () => trial.goWest(), null, ["w", "left", "l"], true));
});

firstTrial.addItems(southeastMenhir, northeastMenhir, northwestMenhir, tutorSigil, yourSigil, river, ditch);
