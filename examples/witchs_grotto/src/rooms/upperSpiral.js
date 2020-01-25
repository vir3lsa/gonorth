import { Room } from "../../../../lib/gonorth";
import { lowerSpiral } from "./lowerSpiral";

export const upperSpiral = new Room("Upper Spiralling Corridor", "placeholder");
upperSpiral.setDown(lowerSpiral);
