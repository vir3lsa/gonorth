/// <reference types="cypress" />

describe("ParserBar", () => {
  beforeEach(() => {
    cy.startGame();
  });

  it("Keeps a command history", () => {
    cy.say("examine device");
    cy.say("jump up and down");
    cy.say("talk double Dutch");

    cy.get("input").type("{upArrow}");
    cy.get("input").should("have.value", "talk double Dutch");

    cy.get("input").type("{upArrow}");
    cy.get("input").should("have.value", "jump up and down");

    cy.get("input").type("{upArrow}");
    cy.get("input").should("have.value", "examine device");

    cy.get("input").type("{downArrow}");
    cy.get("input").should("have.value", "jump up and down");

    cy.get("input").type("{downArrow}");
    cy.get("input").should("have.value", "talk double Dutch");

    cy.get("input").type("{downArrow}");
    cy.get("input").should("have.value", "");

    cy.get("input").type("An unfinished command");

    cy.get("input").type("{upArrow}");
    cy.get("input").should("have.value", "talk double Dutch");

    cy.get("input").type("{downArrow}");
    cy.get("input").should("have.value", "An unfinished command");

    cy.get("input").type("{enter}");
    cy.get("input").should("have.value", "");

    cy.get("input").type("{upArrow}{upArrow}{upArrow}{upArrow} again");
    cy.get("input").should("have.value", "examine device again");

    cy.get("input").type("{enter}{upArrow}");
    cy.get("input").should("have.value", "examine device again");

    cy.get("input").type("{upArrow}{upArrow}{upArrow}{upArrow}");
    cy.get("input").should("have.value", "examine device");
  });
});
