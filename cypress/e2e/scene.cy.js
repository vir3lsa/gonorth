/// <reference types="cypress" />

describe("Scene", () => {
  it("Does not display the scene bar on the start screen", () => {
    cy.get('[data-testid="sceneBar"]').should("not.exist");
  });

  it("Shows the scene bar once the game has started", () => {
    cy.startGame();
    cy.get('[data-testid="sceneBar"]');
  });

  it("Allows the scene image to be toggled", () => {
    cy.startGame();
    cy.get('[data-testid="scene-image"]');
    cy.get('[data-testid="image-toggle"]').click();
    cy.get('[data-testid="scene-image"]').should("not.exist");
  });

  it("Does not show the image toggle in a scene with no image", () => {
    cy.startGame();
    cy.say("east", "Going east.");
    cy.choose("Next");
    cy.get('[data-testid="scene-image"]').should("not.exist");
    cy.get('[data-testid="image-toggle"]').should("not.exist");
  });

  it("Shows the scene bar in the correct places after restarting", () => {
    cy.startGame();
    cy.visit("http://localhost:8080/");
    cy.get('[data-testid="sceneBar"]').should("not.exist");
    cy.choose("continue");
    cy.get('[data-testid="sceneBar"]');
  });
});
