import { Room, selectPlayer } from "../../../../lib/gonorth";

export const staircase = new Room("Staircase", () => {
  switch (selectPlayer().stairsStage) {
    case 0:
      return "You begin climbing the long, narrow staircase, the walls looming oppressively close to either side of you. The deep shadows in front of you gradually yield as you step into them, revealing step after step after step. After a short while the stairs start to curl round to the right and you soon lose sight of the bottom.\n\nYou only really have two choices - continue upwards or go back down.";
    default:
      return "You continue trudging upwards, the stairs spiralling round always to the right. The shadows and the walls continue to be oppressive, never quite reaching pitch blackness, but never lightening either. The only discernible change is that the steps have gone from stone to wooden. On the walls you can just make out some strange symbols, but those have always been present, you realise.";
  }
});

staircase.setUp(staircase, true, () => selectPlayer().stairsStage++);
