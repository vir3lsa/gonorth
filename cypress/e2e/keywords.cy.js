/// <reference types="cypress" />

describe("keywords", () => {
  beforeEach(() => {
    cy.startGame();
  });

  it("lists player's items", () => {
    const emptyInventoryRegex = /(holding anything|carrying anything|got nothing|hands are empty)/;

    // Check full word
    cy.say("inventory");
    cy.shows(emptyInventoryRegex);

    // Same again with alias
    cy.say("i");
    cy.showsLast(emptyInventoryRegex);

    // Take some items
    cy.say("take apple");
    cy.say("take orange");
    cy.say("take strange device");

    // List the items
    cy.say("i");
    cy.showsLast("an apple, an orange, and a strange device");
  });

  it("lists keywords", () => {
    cy.say("keywords");
    cy.shows("keywords");
    cy.shows("inventory");
    cy.shows("north");
    cy.shows("help");
  });

  it("shows help pages", () => {
    cy.say("help");
    cy.shows("work of interactive fiction");
    cy.choose("next");
    cy.shows("Commands are usually of the form");
    cy.choose("next");
    cy.shows("Both verbs and objects");
    cy.choose("previous");
    cy.showsLast("Commands are usually of the form");
    cy.choose("cancel help");
    cy.shows("have fun");
    cy.choose("next");
    cy.get("input").should("exist");
  });
});
