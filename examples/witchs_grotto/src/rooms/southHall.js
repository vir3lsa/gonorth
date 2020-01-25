import { Room } from "../../../../lib/gonorth";
import { bedroom } from "./bedroom";
import { upperSpiral } from "./upperSpiral";

export const southHall = new Room("South Hall", "placeholder");

southHall.setEast(bedroom);
southHall.setSouth(upperSpiral);
