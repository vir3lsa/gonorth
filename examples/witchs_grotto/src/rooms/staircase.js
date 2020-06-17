import { Room } from "../../../../lib/gonorth";

export const staircase = new Room("Staircase", () => {
  staircase.stage++;

  switch (staircase.stage) {
    case 1:
      return "You begin climbing the long, narrow staircase, the walls looming oppressively close to either side of you. The deep shadows in front of you gradually yield as you step into them, revealing step after step after step. After a short while the stairs start to curl round to the right and you soon lose sight of the bottom.\n\nYou only really have two choices - continue upwards or go back down.";
    case 2:
      return "You continue trudging upwards, the stairs spiralling round always to the right. The shadows and the walls continue to be oppressive, never quite reaching pitch blackness, but never diminishing either. The only discernible change is that the steps have gone from stone to wooden. On the walls you can just make out some strange symbols, but those have always been present, you realise.";
    case 3:
      return "You keep expecting to see a landing, but one never arrives. The narrow staircase continues curling around to the right, marching ever upwards. You can see six or seven steps in front of you before they disappear out of sight around the bend, and about the same number behind you. Perseverance, that's what's needed.";
    default:
      return "Left, then right, then left, then right. You keep walking, your legs muscles burning, but there's no end to the stairs in sight.";
  }
});

// Tracker to determine how many times the player has attempted to ascend.
staircase.stage = 0;

staircase.setUp(staircase, true, null, null, false);
