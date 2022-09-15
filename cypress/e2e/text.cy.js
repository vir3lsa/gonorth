/// <reference types="cypress" />

describe("RandomText", () => {
  beforeEach(() => {
    cy.startGame();
  });

  it("produces texts in a random (but predictable, during tests) order", () => {
    cy.say("press red button", "A pattern of intersecting triangles");
    cy.say("press red button", "A strange symbol, somewhat resembling a double helix");
    cy.say("press red button", "The wall displays a green circle");
    cy.say("press red button", "A blue square appears on the wall");
    cy.say("press red button", "A black cross forms on the wall");
    cy.say("press red button", "A pattern of intersecting triangles");
    cy.say("press red button", "A strange symbol, somewhat resembling a double helix");
    cy.say("press red button", "The wall displays a green circle");
    cy.say("press red button", "A blue square appears on the wall");
    cy.say("press red button", "A black cross forms on the wall");
  });
});
