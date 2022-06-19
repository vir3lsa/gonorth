/// <reference types="cypress" />

describe("basic checkpoint tests", () => {
  beforeEach(() => {
    cy.startGame();
  });

  it("saves the game and reloads it", () => {
    // Change some state - pick up an object.
    cy.say("take pale", "the pale");

    // Travel to a room that triggers a checkpoint.
    cy.say("debug goto bedroom", "lavish bed chamber", { global: true });

    // Reload the game - should return to the bedroom.
    cy.reloadGame("lavish bed chamber", { global: true });

    // Check the state
    cy.say("i", "a pale");
    cy.say("debug goto cellar", "smells of rotting Earth", { global: true });
    cy.doesNotShow("pale");
  });

  it("saves the game and starts a new game", () => {
    // Change some state and trigger a checkpoint.
    cy.say("take pale", "the pale");
    cy.say("debug goto bedroom", "lavish bed chamber", { global: true });

    // Start a new game and check the state.
    cy.newGame();
    cy.shows("rusty pale");
    cy.say("i", /(holding anything|carrying anything|got nothing|hands are empty)/);
  });
});
