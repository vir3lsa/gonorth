/// <reference types="cypress" />

describe("Cypress commands", () => {
  it("Generates cypress commands for actions, accounting for new pages and h2 tags", () => {
    cy.startGame();
    cy.say("press green button", "CONSIDER", { element: "h2" });
    cy.say(
      "debug cypress list",
      'cy.choose("play", "You awaken slowly, as if from", {"global":true});',
      'cy.choose("Next", "You realise you have no idea");',
      `cy.choose("Next", "The game you're playing, The", {"global":true});`,
      'cy.choose("cancel help", "To view these help pages");',
      'cy.choose("Next", "The room you find yourself in", {"global":true});',
      'cy.say("press green button", "CONSIDER", {"element":"h2"});',
      { element: "ul" }
    );
  });
});
