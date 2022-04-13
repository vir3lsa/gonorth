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

Cypress.Commands.add("choose", (label) => {
  cy.contains("button", label, { matchCase: false }).click();
});

Cypress.Commands.add("shows", (text) => {
  cy.contains(".gonorth", text, { matchCase: false });
});

Cypress.Commands.add("showsLast", (text) => {
  cy.contains(".gonorth p:last-child", text, { matchCase: false });
});

Cypress.Commands.add("say", (text) => {
  cy.get("input").type(`${text}{enter}`);
});

Cypress.Commands.add("startGame", () => {
  cy.visit("http://localhost:8080/");
  cy.choose("play");
  cy.shows("Now's your chance");
  cy.choose("next");
  cy.shows("The game you're playing");
  cy.choose("cancel help");
  cy.shows("Good luck");
  cy.choose("next");
});
