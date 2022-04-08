/// <reference types="cypress" />

beforeEach(() => {
  cy.startGame();
});

it("lists player's items", () => {
  // Check full word
  cy.say("inventory");
  cy.shows("not holding anything");

  // Same again with alias
  cy.say("i");
  cy.showsLast("not holding anything");

  // Spawn some items
  cy.say("debug spawn apple");
  cy.say("debug spawn orange");
  cy.say("debug spawn kitchen sink");
  cy.say("take apple");
  cy.say("take orange");
  cy.say("take kitchen sink");

  // List the items
  cy.say("i");
  cy.showsLast("an apple, an orange and a kitchen sink");
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
