import { ActionChain } from "../../../../lib/gonorth";

class PotionEffects {
  constructor() {
    this.potionEffects = {};
  }

  add(potion, item, successful, ...effects) {
    const affectedItems = this.potionEffects[potion.name] || {};
    this.potionEffects[potion.name] = affectedItems;

    affectedItems[item.name] = {
      successful,
      effects: new ActionChain(effects)
    };
  }

  hasEffect(potion, item) {
    return (
      this.potionEffects[potion.name] &&
      this.potionEffects[potion.name][item.name] &&
      this.potionEffects[potion.name][item.name].successful
    );
  }

  apply(potion, item) {
    const effects = this.potionEffects[potion.name][item.name].effects;

    if (effects) {
      return effects;
    }

    return `You carefully pour a drop of the potion onto the ${item.name} but nothing happens. It doesn't appear to be affected by the ${potion.name}`;
  }
}

export const potionEffects = new PotionEffects();
