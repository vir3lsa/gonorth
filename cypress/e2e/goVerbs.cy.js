/// <reference types="cypress" />

describe("go verbs", () => {
  beforeEach(() => {
    cy.startGame();
  });

  it("requires player to be holding the device before going west", () => {
    cy.say("w", "have to be holding the strange device");
    cy.say("take device", "the strange device");
    cy.say("w", "Going west");
    cy.choose("Next", "beautiful forest green", { global: true });
  });

  it("requires a door to be open before the player can go through it", () => {
    cy.say("take device", "the strange device");
    cy.say("w", "Going west");
    cy.choose("Next", "beautiful forest green", { global: true });
    cy.say("go through door", "door is closed");
  });

  it("allows the player to go through a door if the condition is met", () => {
    cy.say("take device", "the strange device");
    cy.say("w", "Going west");
    cy.choose("Next", "beautiful forest green", { global: true });
    cy.say("open door", "opens relatively easily");
    cy.say("drop device", "device on the floor");
    cy.say("go through door", "have to be holding the strange device");
    cy.say("take device");
    cy.say("go through door", "step into the green wall");
  });
});
