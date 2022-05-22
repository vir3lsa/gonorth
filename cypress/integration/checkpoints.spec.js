/// <reference types="cypress" />

describe("basic checkpoint tests", () => {
  beforeEach(() => {
    cy.startGame();
  });

  it("saves the game and reloads it", () => {
    // Change some state - pick up an object.
    cy.say("take pale", "the pale");

    // Travel to a room that triggers a checkpoint.
    cy.say("debug goto bedroom");

    // Reload the game - should return to the bedroom.
    cy.reloadGame("lavish bed chamber");

    // Check the state
    cy.say("i", "a pale");
    cy.say("debug goto cellar");
    cy.doesNotShow("pale");
  });

  it("saves the game and starts a new game", () => {
    // Change some state and trigger a checkpoint.
    cy.say("take pale", "the pale");
    cy.say("debug goto bedroom");

    // Start a new game and check the state.
    cy.newGame();
    cy.shows("rusty pale");
    cy.say("i", /(holding anything|carrying anything|don't have anything|hands are empty)/);
  });
});
