import Room from "../../../../lib/game/room";
import { southHall } from "./southHall";

export const pantry = new Room("Pantry", "placeholder");

pantry.setEast(southHall);
