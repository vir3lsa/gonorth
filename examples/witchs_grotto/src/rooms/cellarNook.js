import { Room, selectPlayer } from "../../../../lib/gonorth";
import { monster, tunnelsGraph } from "./tunnels";

export const cellarNook = new Room("Cellar Nook", () => {
  if (selectPlayer().felineVision) {
    return tunnelsGraph.commence();
  } else {
    return "It's extremely dark in here and you can't make out a thing. The roof is so low you have to constantly duck your head and the floor is uneven, daring you to trip. You feel your way along one wall with your hands outstretched. Looking back, you can't even see the archway you came through. The nook continues to the West, but going any further without a light would be unwise.";
  }
});

cellarNook.addItem(monster);