/// <reference types="cypress" />

describe("growth potion", () => {
  beforeEach(() => {
    cy.startGame();
  });

  it("creates a growth potion", () => {
    cy.say("debug goto apothecary", "apothecary or decoction room", { global: true });
    cy.say("debug spawn gneiss", "Spawned gneiss in Apothecary");
    cy.say("x gneiss", "A rough, greyish-pink stone");
    cy.say("put gneiss on pentagram", "the gneiss stone", "stone on the pentagram");
    cy.say("x pipes", "There's a spout above the");
    cy.say("turn dial", "You turn the dial to point at");
    cy.say("turn dial", "You turn the dial to point at");
    cy.say("open valve", "You grab the crank wheel with");
    cy.say("close valve", "You spin the valve wheel back");
    cy.say("x jars", "This must be the witch's");
    cy.say("add calendula to cauldron", "the Calendula", "some Calendula in the cauldron");
    cy.say("debug spawn litany of change", "Spawned litany of change in");
    cy.say("take litany of change", "the Litany of Change");
    cy.say("recall", "Litany of Change");
    cy.say("say litany of change", "chant the Litany");
    cy.choose("Next", "You sense energy building");
    cy.say("debug spawn demon's paste", "Spawned demon's paste in");
    cy.say("put demon's paste in pot", "the Demon's Paste");
    cy.say("debug spawn matches", "Spawned matches in Apothecary");
    cy.say("light fire with matches", "Striking one of the big");
    cy.say("stir pot with ladle", "resists the movement");
    cy.choose("Keep stirring", "sloshing this way and that");
    cy.choose("Keep stirring", "whipping back and forth");
    cy.choose("Keep stirring", "seems to be swirling");
    cy.choose("Stop stirring");
    cy.say("stir pot with ladle", "finally dies down");
    cy.choose("Stop stirring");
    cy.say("put out fire with cover", "You pull the metal cover over");
    cy.say("x pot", "lumpy and semi-solid");
    cy.say("debug spawn spiritual apotheosis", "Spawned spiritual apotheosis");
    cy.say("take spiritual", "the Spiritual");
    cy.say("words", "Spiritual Apotheosis");
    cy.say("say spiritual", "utter the triumphant passages");
    cy.choose("Next", "The words roll from your");
    cy.say("x pot", "very dark red paste");
    cy.say("take potion", "You grab an empty vial from");
    cy.say("x acromegaly", "You're not sure why it's");
  });

  const lightRegex = /(kind where you can|up to it, you can)/;

  it("causes the player to grow", () => {
    cy.say("debug timeout 0", "timeouts set to 0 milliseconds");
    cy.say("debug spawn acromegaly", "Spawned acromegaly in Cellar");
    cy.say("drink acromegaly", "the Acromegaly Solution", "bottle to your lips");
    cy.choose("Next", "The effect is instantaneous.");
    cy.choose("Next", "Finally, your growth slows");
    cy.say("x light", lightRegex);
    cy.say("x light", lightRegex);
    cy.say("x light", lightRegex, "beginning to shrink", "legs are shortening", "back to your normal height");
  });
});
