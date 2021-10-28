import { Room } from "@gonorth";
import { Item } from "../../../lib/gonorth";

export const firstTrial = new Room(
  "First Trial",
  "Before you lies a small clearing somewhere in the heart of the Endless Woods. Running across the clearing from East to West is a gurgling and splashing brook. There's no bridge across it that you can see. On the North side of the brook a ditch has been carved into the ground from the Northern edge of the clearing, down to the river, such that it's filled with water, forming a barrier separating the two quarters of the arena North of the brook.\n\nTwo tall stone monoliths stand like silent sentries in the clearing - one on the South side of the river, the other on the North side, to the East of the dividing ditch.\n\nThe tutor's sigil is on the West side of the ditch, in the North West corner of the clearing."
);

const southMenhir = newItem({
  name: "southern menhir",
  description:
    "Like its partner across the river, it must be thirty feet tall, made of rough grey rock and shaped vaguely like an elongated egg stood upright, though the lower extent is still buried beneath the earth. At ground level it has four relatively flat sides, though it becomes more rounded higher up.\n\nThere's something quite uncanny about it - the fact it rose up just moments ago, as if the ground were experiencing a particularly sudden and accelerated spurt of teething, probably has something to do with it.",
  aliases: ["monolith", "obelisk", "stone", "rock"]
});

const northMenhir = newItem({
  name: "northern menhir",
  description:
    "The menhir on the Northern side of the brook is perhaps a shade taller than its partner, but still around thirty feet high. There are swirling patterns higher up, you notice, lacing the stone with curving lines, whorls and spirals. The designs peter out before ground level, leaving the four faces relatively flat and featureless.",
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
  .withDescription("placeholder")
  .withAliases(["brook", "stream", "water"])
  .build();

const ditch = new Item.Builder()
  .withName("ditch")
  .withDescription("placeholder")
  .withAliases(["dyke", "pit", "barrier", "trench"])
  .build();

firstTrial.addItems(southMenhir, northMenhir, tutorSigil, yourSigil, river, ditch);