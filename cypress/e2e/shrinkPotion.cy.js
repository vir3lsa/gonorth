/// <reference types="cypress" />

describe("shrink potion", () => {
  beforeEach(() => {
    cy.startGame();
  });

  it("creates a shrink potion", () => {
    cy.say("debug goto apothecary", "apothecary or decoction room", { global: true });
    cy.say("debug spawn peridot", "Spawned peridot in Apothecary");
    cy.say("x peridot", "glassy, pale green gemstone");
    cy.say("put peridot on pentagram", "the peridot gemstone", "gemstone on the pentagram");
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
    cy.say("x pot", "very pale blue paste");
    cy.say("take potion", "You grab an empty vial from");
    cy.say("x tonic", "vaguely blue in colour");
  });

  const lightRegex = /(kind where you can|up to it, you can)/;

  it("causes the player to shrink", () => {
    cy.say("debug timeout 0 1", "timeouts set to 0 milliseconds and 1 turn(s)");
    cy.say("debug spawn contraction", "Spawned contraction in Cellar");
    cy.say("drink contraction", "the Tonic of Vertical Contraction", "bottle to your lips");
    cy.choose("Next", "loom up around you");
    cy.choose("Next", "shrink and shrink");
    cy.say("x light", lightRegex, "butterflies in your stomach");
    cy.say("x light", lightRegex, "arms and legs are aching");
    cy.say("x light", lightRegex, "you're growing now", "growth is slowing", "your usual size");
  });

  it.only("causes the player to drop items", () => {
    cy.say("debug timeout 0 1", "timeouts set to 0 milliseconds and 1 turn(s)");
    cy.say("pick up bucket", "the pale");
    cy.say("debug spawn contraction", "Spawned contraction in Cellar");
    cy.say("drink contraction", "the Tonic of Vertical Contraction", "bottle to your lips");
    cy.choose("Next", "loom up around you");
    cy.choose("Next", "forced to drop the pale");
    cy.choose("Next", "shrink and shrink");
  });
});
