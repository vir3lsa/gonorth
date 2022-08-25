/// <reference types="cypress" />

describe("final puzzle", () => {
  beforeEach(() => {
    cy.startGame();
  });

  it("rows out of the cavern", () => {
    cy.say("debug goto cavern", "You're in a naturally-formed", { global: true });
    cy.say("debug spawn toy boat", "Spawned toy boat in Cavern");
    cy.say("debug variable store toyBoatMended true", "Variable stored");
    cy.say("debug variable store playerTiny true", "Variable stored");
    cy.say("put boat in water", "the toy boat", "in the lake", "hull prevents any ingress");
    cy.say("board boat", "You're now the perfect size");
    cy.say("row boat south", "You take hold of the oar");
    cy.choose("Next", "Inky black water stretches");
    cy.choose("Next", "Eventually, you reach the far");
    cy.say("row boat south", "into the tunnel mouth");
    cy.choose("Next", "turn your head", { global: true });
    cy.choose("Next", "amplified in here");
    cy.choose("Next", "colliding with the tunnel wall");
    cy.choose("Next", "straightens out again");
    cy.choose("Next", "huddled in the bottom");
    cy.choose("Next", "dinghy leaves the tunnel");
    cy.choose("Next", "You know this place");
    cy.choose("Next", "little path wends", { global: true });
    cy.choose("Next", "enter through the kitchen door");
    cy.choose("Next", "head through into the living");
    cy.choose("Next", "not in the bedroom either");
    cy.choose("Next", "blood to freeze");
    cy.choose("Next", "smooth as honey");
    cy.choose("Next", "done to her?");
    cy.choose("Next", "simply going to eat you");
    cy.choose("Next", "into the expectant dusk");
    cy.choose("Next", "THE END", { global: true });
    cy.choose("Return to main menu", "The Lady of Bramble Wood", { global: true });
  });
});
