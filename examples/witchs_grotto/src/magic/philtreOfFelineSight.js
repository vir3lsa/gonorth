import { store } from "../../../../lib/gonorth";
import { Potion } from "./alchemy";

let philtreOfFelineVision;

export const initPhiltreOfFelineVision = () => {
  philtreOfFelineVision = new Potion(
    "Philtre of Feline Vision",
    "A dark liquid that seems to swirl about its container unbidden, flecks of silver glinting for an instant then whisked away by the perpetual vortex.",
    true,
    () => store("felineVision", true),
    "You steel yourself before glugging down another suspect potion. This one tastes of fish. Of *course* it would be fish. Just as it seemed to swirl in the beaker, it dances in your mouth and down your throat as though alive.",
    "After draining the last drop you peer around the room expectantly. Yes...the shadows in the corners definitely look less dark now and there's a certain sharpness that was missing before."
  );

  return philtreOfFelineVision;
};
