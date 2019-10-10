import Room from "../../../../lib/game/room";
import { bedroom } from "./bedroom";
import { staircase } from "./staircase";

export const southHall = new Room("South Hall", "placeholder");

southHall.setEast(bedroom);
southHall.setSouth(staircase);
