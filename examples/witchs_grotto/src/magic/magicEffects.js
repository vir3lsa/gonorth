import { Effects } from "../../../../lib/gonorth";

export const DRINK = { name: "drink" };

export const potionEffects = new Effects(
  (potion, item) =>
    `You carefully pour a drop of the potion onto the ${item.name} but nothing happens. It doesn't appear to be affected by the ${potion.name}.`
);
