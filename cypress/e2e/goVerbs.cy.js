/// <reference types="cypress" />

describe("keywords", () => {
  beforeEach(() => {
    cy.startGame();
  });

  it("requires player to be holding the device before going west", () => {
    cy.say("w", "have to be holding the strange device");
    cy.say("take device", "the strange device");
    cy.say("w", "Going west");
    cy.choose("Next", "beautiful forest green", { global: true });
  });
});
