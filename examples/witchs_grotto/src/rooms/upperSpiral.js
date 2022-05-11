import { Room } from "../../../../lib/gonorth";
import { initLowerSpiral } from "./lowerSpiral";

let upperSpiral;

export const getUpperSpiral = () => {
  return upperSpiral;
};

export const initUpperSpiral = () => {
  upperSpiral = new Room(
    "Upper Spiralling Corridor",
    "You're stood in a low-ceilinged corridor that curves gently downwards and out of sight. On closer inspection, \"tunnel\" seems a more apt word as it seems to have been carved through solid rock, albeit with a roughly rectangular cross-section. Your head is nearly touching the rough stone above, and you're only small. Anyone bigger would have to stoop.\n\nTo the North is a rickety wooden door.",
    true
  );
  upperSpiral.setDown(initLowerSpiral());
  return upperSpiral;
};
