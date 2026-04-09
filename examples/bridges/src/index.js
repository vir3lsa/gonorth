import gn, { PagedText } from "@gonorth";
import { firstTrial } from "./firstTrial";
import { helpGraph } from "./help";

gn.initGame("The Trial of the Bridges", "Rich Locke", { debugMode: true }, "0.0.1");
gn.setIntro(
  new PagedText(
    "So, young one. You've journeyed across the great back of the world to be here. Tell me - are you prepared for the trials?",
    "Good! Then let us begin.",
    "The forest clearing changes before your eyes, rearranging and reconfiguring itself to the whims of the silver-robed tutor standing to one side. Great monoliths of stone rise from the ground whilst, elsewhere, ditches come into being and sink lower, wider, before filling with water and becoming coursing rivers."
  )
);
gn.setStartingRoom(firstTrial);
gn.setHelp(helpGraph);

if (typeof document !== "undefined") {
  let container = document.querySelector("#container");
  gn.attach(container);
}

gn.play();
