/// <reference types="cypress" />

describe("Scene", () => {
  it("Does not display the scene bar on the start screen but does display an image", () => {
    cy.visit("http://localhost:8080/");
    cy.getSceneBar().should("not.exist");
    cy.getSceneImage();
  });

  it("Shows the scene bar once the game has started", () => {
    cy.startGame();
    cy.getSceneBar();
  });

  it("Allows the scene image to be toggled", () => {
    cy.startGame();
    cy.getSceneImage();
    cy.getImageToggle().click();
    cy.getSceneImage().should("not.exist");
  });

  it("Does not show the image toggle in a scene with no image", () => {
    cy.startGame();
    cy.say("east", "Going east.");
    cy.choose("Next");
    cy.getSceneImage().should("not.exist");
    cy.getImageToggle().should("not.exist");
  });

  it("Shows the scene bar in the correct places after restarting", () => {
    cy.startGame();
    cy.visit("http://localhost:8080/");
    cy.getSceneBar().should("not.exist");
    cy.choose("continue");
    cy.getSceneBar();
  });

  let lastImageUrl;
  const checkImageChanged = () => {
    cy.getImageUrl().then((url) => {
      expect(lastImageUrl).not.to.be.undefined;
      expect(url).not.to.be.undefined;
      expect(url).not.to.eq(lastImageUrl);
      lastImageUrl = url;
    });
  };

  it("Shows an OptionGraph's image and switches back to the room image", () => {
    lastImageUrl = undefined;
    cy.startGame();

    // Record the room image style
    cy.getImageUrl().then((url) => (lastImageUrl = url));
    cy.say("shout", "The lights go out");

    // Should be showing a different image.
    checkImageChanged();

    cy.choose("Stop shouting", "To your relief, the lights");
    checkImageChanged();
    cy.say("shout", "The lights go out");
    checkImageChanged();
    cy.choose("Shout louder");
    checkImageChanged();
    cy.say("shout", "The lights go out");
    checkImageChanged();
    cy.choose("Squeal", "Here come the lights");
    checkImageChanged();
  });
});
