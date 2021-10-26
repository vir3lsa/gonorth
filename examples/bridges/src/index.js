import { initGame, play, attach, setIntro } from "@gonorth";

initGame("The Trial of the Bridges", "Rich Locke", true);
setIntro("So, young one. Are you prepared for the trials?");

if (typeof document !== "undefined") {
  let container = document.querySelector("#container");
  attach(container);
}

play();
