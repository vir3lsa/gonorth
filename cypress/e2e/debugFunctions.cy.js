/// <reference types="cypress" />

describe("debug functions", () => {
  beforeEach(() => {
    cy.startGame();
  });

  it("sets event timeouts to 0 milliseconds", () => {
    // Fire device. No result as event has 10s delay.
    cy.say("fire device", "You grab the strange device", "Nothing happens");
    cy.doesNotShow("blinding white light");

    // Set timeouts to 0. Should get result immediately this time.
    cy.say("debug event 0", "Event timeouts set to 0");
    cy.say("fire device", "Nothing happens", "blinding white light");

    // Turn-based event should not have triggered yet.
    cy.doesNotShow("Belatedly");

    // It will trigger after 5 turns.
    cy.say("x device");
    cy.say("x device");
    cy.say("x device");
    cy.say("x device");
    cy.say("x device", "Belatedly, a hole appears");

    // Override event turn delays.
    cy.say("debug event 0 0", "Event timeouts set to 0 milliseconds and 0 turn(s)");
    // cy.pause();

    // Now all events should happen (more or less) immediately.
    cy.say("fire device", "Nothing happens", "blinding white light");

    // Actually, the turns-delayed event happens next turn.
    cy.say("x device", "Belatedly, a hole appears");
  });
});
