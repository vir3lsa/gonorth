import { retrieve, Room } from "../../../../lib/gonorth";
import { getMonster, initTunnelsGraph } from "./tunnels";

let room;

export const getCellarNook = () => {
  return room;
};

export const initCellarNook = () => {
  const tunnelsGraph = initTunnelsGraph();
  room = new Room("Cellar Nook", () => {
    if (retrieve("felineVision")) {
      return tunnelsGraph.commence();
    } else {
      return "It's extremely dark in here and you can't make out a thing. The roof is so low you have to constantly duck your head and the floor is uneven, daring you to trip. You feel your way along one wall with your hands outstretched. Looking back, you can't even see the archway you came through. The nook continues to the West, but going any further without a light would be unwise.";
    }
  });

  room.addItem(getMonster());
  return room;
};
