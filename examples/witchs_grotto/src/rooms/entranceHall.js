import { Room } from "../../../../lib/gonorth";
import { southHall } from "./southHall";

export const entranceHall = new Room("Entrance Hall", "placeholder");

entranceHall.setSouth(southHall);