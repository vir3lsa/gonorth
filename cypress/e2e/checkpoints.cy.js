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
    cy.say("east", "Going east");
    cy.choose("Next", "ceiling is blood red", { global: true });

    // Reload the game - should return to the bedroom.
    cy.reloadGame("ceiling is blood red", { global: true });

    // Check the state
    cy.say("i", "a strange device");
    cy.say("west", "Going west");
    cy.choose("Next", "nearly perfect cube", { global: true });
    cy.doesNotShow("strange device");

    // Custom properties have reloaded
    cy.say("x device", "It's set to tickle");
  });

  it("saves the game and starts a new game", () => {
    // Change some state and trigger a checkpoint.
    cy.say("take strange device", "the strange device");
    cy.say("east", "Going east");
    cy.choose("Next", "ceiling is blood red", { global: true });

    // Start a new game and check the state.
    cy.newGame();
    cy.shows("strange device");
    cy.say("i", /(holding anything|carrying anything|got nothing|hands are empty)/);

    // Check the 'auto take' action still exists (there was a defect where it was erased).
    cy.say("put strange device on table", "You pick up the strange device", "You put the strange device on the table");
  });

  it("maintains the correct inventory size on reload", () => {
    // Pick up a large item and trigger a save.
    cy.say("take large object", "the large object");
    cy.say("east", "Going east");
    cy.choose("Next", "ceiling is blood red", { global: true });

    // Start a new game and check we can still pick up the large item.
    cy.newGame();
    cy.say("drop large object on floor", "the large object");
    cy.say("i", "not carrying anything");
    cy.say("take large object", "the large object");
    cy.say("i", "a large object");
  });

  it("Resumes from the last hint seen", () => {
    // Move to the second hint.
    cy.say("hint", "Have you seen the device");
    cy.choose("next", "Have you tried pressing the");
    cy.choose("okay");
    cy.say("x", "The room you find yourself in", { global: true });

    // Reload the game and check we resume at the same hint.
    cy.reloadGame();
    cy.say("hint", "Have you tried pressing the");

    // Start a new game and check the hints start at the beginning.
    cy.newGame();
    cy.say("hint", "Have you seen the device");
  });
});
