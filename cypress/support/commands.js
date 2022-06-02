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

Cypress.Commands.add("showsLast", (text, element = "p") => {
  cy.contains(`.gonorth h6:last-of-type ~ ${element}`, text, { matchCase: false });
});

const checkExpected = (expected, options) => {
  if (expected) {
    if (options?.global) {
      cy.shows(expected);
    } else {
      cy.showsLast(expected, options?.element);
    }
  }
};

Cypress.Commands.add("choose", (label, expected, options) => {
  cy.contains("button", label, { matchCase: false }).click();
  checkExpected(expected, options);
});

Cypress.Commands.add("say", (text, expected, options) => {
  cy.get("input").type(`${text}{enter}`);
  checkExpected(expected, options);
});

/**
 * Starts a brand new game, (automatically) deleting any previous save game.
 */
Cypress.Commands.add("startGame", () => {
  cy.visit("http://localhost:8080/");
  cy.choose("play");
  cy.shows("Now's your chance");
  cy.choose("next", "The game you're playing", { global: true });
  cy.choose("cancel help", "Good luck");
  cy.choose("next", "smells of rotting Earth", { global: true });
});

/**
 * Reloads the game and uses a saved game to return to a previous checkpoint.
 */
Cypress.Commands.add("reloadGame", (expected, options) => {
  cy.visit("http://localhost:8080/");
  cy.choose("continue");
  checkExpected(expected, options);
});

/**
 * Reloads the game and uses a saved game to return to a previous checkpoint.
 */
Cypress.Commands.add("newGame", () => {
  cy.visit("http://localhost:8080/");
  cy.choose("new game", "want to continue?", { global: true });
  cy.choose("yes", "Now's your chance", { global: true });
  cy.choose("next", "The game you're playing", { global: true });
  cy.choose("cancel help", "Good luck");
  cy.choose("next", "smells of rotting Earth", { global: true });
});
