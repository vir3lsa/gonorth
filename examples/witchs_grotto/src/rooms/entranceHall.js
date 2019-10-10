import Room from "../../../../lib/game/room";
import { southHall } from "./southHall";

export const entranceHall = new Room("Entrance Hall", "placeholder");

entranceHall.setSouth(southHall);
