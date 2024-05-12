/// <reference types="cypress" />

describe("go verbs", () => {
  beforeEach(() => {
    cy.startGame();
  });

  it("allows the player to go through a door, possibly with an alias, if conditions are met", () => {
    cy.say("take device", "the strange device");
    cy.say("w", "Going west");
    cy.choose("Next", "beautiful forest green", { global: true });
    cy.say("go through door", "door is closed");
    cy.say("open door", "opens relatively easily");
    cy.say("drop device", "device on the floor");
    cy.say("go through door", "have to be holding the strange device");
    cy.say("take device");
    cy.say("transit door", "step into the green wall");
  });
});
