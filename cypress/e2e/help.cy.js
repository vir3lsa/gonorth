/// <reference types="cypress" />

describe("Help", () => {
  it("sets scene components", () => {
    cy.startGame();
    cy.getSceneLocation().contains("White Room");
    cy.getSceneImage().should("exist");

    // Enter help pages.
    cy.say("help", "What do you need help with?", { global: true });

    // The image has cleared.
    cy.getSceneImage().should("not.exist");

    // The page has cleared.
    cy.doesNotShow("nearly perfect cube");

    // The room name has changed.
    cy.getSceneLocation().contains("Help");

    // Close help
    cy.choose("Cancel Help", "To view these help pages");

    // Room name and image shouldn't be back until we click Next.
    cy.getSceneImage().should("not.exist");
    cy.getSceneLocation().contains("Help");

    // Click next.
    cy.choose("Next", "nearly perfect cube", { global: true });

    // Room name and image changes back.
    cy.getSceneLocation().contains("White Room");
    cy.getSceneImage().should("exist");
  });
});
