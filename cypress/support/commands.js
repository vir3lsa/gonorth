// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add("shows", (text) => {
  cy.contains(".gonorth", text, { matchCase: false });
});

Cypress.Commands.add("doesNotShow", (text) => {
  cy.contains(text).should("not.exist");
});

Cypress.Commands.add("showsLast", (text) => {
  cy.contains(".gonorth h6:last-of-type ~ p", text, { matchCase: false });
});

Cypress.Commands.add("choose", (label, expected) => {
  cy.contains("button", label, { matchCase: false }).click();

  if (expected) {
    cy.shows(expected);
  }
});

Cypress.Commands.add("say", (text, expected) => {
  cy.get("input").type(`${text}{enter}`);

  if (expected) {
    cy.shows(expected);
  }
});

/**
 * Starts a brand new game, (automatically) deleting any previous save game.
 */
Cypress.Commands.add("startGame", () => {
  cy.visit("http://localhost:8080/");
  cy.choose("play");
  cy.shows("Now's your chance");
  cy.choose("next", "The game you're playing");
  cy.choose("cancel help", "Good luck");
  cy.choose("next", "smells of rotting Earth");
});

/**
 * Reloads the game and uses a saved game to return to a previous checkpoint.
 */
Cypress.Commands.add("reloadGame", (expected) => {
  cy.visit("http://localhost:8080/");
  cy.choose("continue");

  if (expected) {
    cy.shows(expected);
  }
});

/**
 * Reloads the game and uses a saved game to return to a previous checkpoint.
 */
Cypress.Commands.add("newGame", () => {
  cy.visit("http://localhost:8080/");
  cy.choose("new game", "want to continue?");
  cy.choose("yes", "Now's your chance");
  cy.choose("next", "The game you're playing");
  cy.choose("cancel help", "Good luck");
  cy.choose("next", "smells of rotting Earth");
});
