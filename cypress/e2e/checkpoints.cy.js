/// <reference types="cypress" />

describe("basic checkpoint tests", () => {
  beforeEach(() => {
    cy.startGame();
  });

  it("saves the game and reloads it", () => {
    // Change some state - pick up an object.
    cy.say("take strange device", "the strange device");

    // Set a custom property - turn dial to 'tickle'
    cy.say("x device", "It's a sleek metal object");
    cy.say("turn dial", "You turn the dial to tickle");

    // Travel to a room that triggers a checkpoint.
    cy.say("east", "Going East");
    cy.choose("Next", "ceiling is blood red", { global: true });

    // Reload the game - should return to the bedroom.
    cy.reloadGame("ceiling is blood red", { global: true });

    // Check the state
    cy.say("i", "a strange device");
    cy.say("west", "Going West");
    cy.choose("Next", "nearly perfect cube", { global: true });
    cy.doesNotShow("strange device");

    // Custom properties have reloaded
    cy.say("x device", "It's set to tickle");
  });

  it("saves the game and starts a new game", () => {
    // Change some state and trigger a checkpoint.
    cy.say("take strange device", "the strange device");
    cy.say("east", "Going East");
    cy.choose("Next", "ceiling is blood red", { global: true });

    // Start a new game and check the state.
    cy.newGame();
    cy.shows("strange device");
    cy.say("i", /(holding anything|carrying anything|got nothing|hands are empty)/);

    // Check the 'auto take' action still exists (there was a defect where it was erased).
    cy.say("put strange device on table", "You pick up the strange device", "You put the strange device on the table");
  });
});
