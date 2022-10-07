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

Cypress.Commands.add("shows", (...texts) => {
  texts.forEach((text) => cy.contains(".gonorth", text, { matchCase: false }));
});

Cypress.Commands.add("doesNotShow", (...texts) => {
  texts.forEach((text) => cy.contains(text).should("not.exist"));
});

Cypress.Commands.add("showsLast", (...texts) => {
  const [expecteds, options] = extractOptions(texts);
  const element = options?.element || "p";
  expecteds.forEach((expected) => cy.contains(`.gonorth h6:last-of-type ~ ${element}`, expected, { matchCase: false }));
});

const extractOptions = (expected) => {
  const lastArg = expected.length && expected[expected.length - 1];
  if (lastArg && typeof lastArg === "object" && !(lastArg instanceof RegExp)) {
    return [expected.slice(0, expected.length - 1), expected[expected.length - 1]];
  }

  return [expected];
};

const checkExpected = (expected) => {
  const [expecteds, options] = extractOptions(expected);
  if (expecteds?.length) {
    if (options?.global) {
      cy.shows(...expecteds);
    } else {
      cy.showsLast(...expected);
    }
  }
};

Cypress.Commands.add("choose", (label, ...expected) => {
  cy.contains("button", label, { matchCase: false }).click();
  checkExpected(expected);
});

Cypress.Commands.add("say", (text, ...expected) => {
  cy.get("input").type(`${text}{enter}`);
  checkExpected(expected);
});

/**
 * Starts a brand new game, (automatically) deleting any previous save game.
 */
Cypress.Commands.add("startGame", (options = {}) => {
  const visitOptions = options.monitorConsole
    ? {
        onBeforeLoad(win) {
          cy.stub(win.console, "log").as("consoleLog");
        }
      }
    : {};
  cy.visit("http://localhost:8080/", visitOptions);
  cy.choose("play");
  cy.shows("You awaken slowly");
  cy.choose("next", "no idea where you are");
  cy.choose("next", "The game you're playing", { global: true });
  cy.choose("cancel help", "Good luck");
  cy.choose("next", "a nearly perfect cube", { global: true });
});

/**
 * Reloads the game and uses a saved game to return to a previous checkpoint.
 */
Cypress.Commands.add("reloadGame", (...expected) => {
  cy.visit("http://localhost:8080/");
  cy.choose("continue");
  checkExpected(expected);
});

/**
 * Reloads the game and uses a saved game to return to a previous checkpoint.
 */
Cypress.Commands.add("newGame", () => {
  cy.visit("http://localhost:8080/");
  cy.choose("new game", "want to continue?", { global: true });
  cy.choose("yes", "You awaken slowly", { global: true });
  cy.choose("next", "no idea where you are");
  cy.choose("next", "The game you're playing", { global: true });
  cy.choose("cancel help", "Good luck");
  cy.choose("next", "a nearly perfect cube", { global: true });
});
