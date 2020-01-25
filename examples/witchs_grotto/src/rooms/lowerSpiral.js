import { Room } from "../../../../lib/gonorth";
import { apothecary } from "./apothecary";

export const lowerSpiral = new Room("Lower Spiral", "placeholder");
lowerSpiral.setWest(apothecary);
