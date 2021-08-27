import { Effects } from "../../../../lib/gonorth";

export const DRINK = { name: "drink" };

export const potionEffects = new Effects(
  (potion, item) =>
    `You carefully pour a drop of the potion onto the ${item.name} but nothing happens. It doesn't appear to be affected by the ${potion.name}.`
);

export const mirrorEffects = new Effects(
  (item, mirror) =>
    `Looking at the ${item.name} in the mirror changes nothing about its appearance. It's the same as ever.`
);