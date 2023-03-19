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
  });
});
