import { Room } from "../../../../lib/gonorth";
import { southHall } from "./southHall";
import { garden } from "./garden";

export const entranceHall = new Room("Entrance Hall", "placeholder");

entranceHall.setSouth(southHall);
entranceHall.setNorth(garden);
