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
    cy.getImageToggle().click();
    cy.getSceneImage().should("exist");
  });

  it("Allows the scene image to be toggled via keywords", () => {
    cy.startGame();
    cy.getSceneImage();
    cy.say("hide scene");
    cy.getSceneImage().should("not.exist");
    cy.say("reveal scene");
    cy.getSceneImage().should("exist");
  });

  it("Shows the scene image when returning to a room", () => {
    cy.startGame();
    cy.getSceneImage();
    cy.getImageToggle().click();
    cy.say("east", "Going east.");
    cy.choose("Next");
    cy.say("west", "Going west.");
    cy.choose("Next");
    cy.getSceneImage().should("exist");
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
  const checkImageChanged = (changed = true) => {
    cy.getImageUrl().then((url) => {
      expect(lastImageUrl).not.to.be.undefined;
      expect(url).not.to.be.undefined;

      if (changed) {
        expect(url).not.to.eq(lastImageUrl);
      } else {
        expect(url).to.eq(lastImageUrl);
      }
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

  it("Reverts an OptionGraphs scene settings back to the room's at the correct time", () => {
    lastImageUrl = undefined;
    cy.startGame();

    // Start an OptionGraph that changes the image and room name.
    cy.say("travel", "You enter the travel tubes.", { global: true });
    cy.getImageUrl().then((url) => (lastImageUrl = url));
    cy.getSceneLocation().contains("Travel Tubes");

    // Trigger an 'exit' option with an action chain.
    cy.choose("exit", "About to exit");

    // Scene should not have reverted after the first action.
    cy.getSceneLocation().contains("Travel Tubes");
    checkImageChanged(false);

    // Scene should change after the final action.
    cy.choose("Next", "Exiting now");
    cy.getSceneLocation().contains("White Room");
    checkImageChanged();

    // Start the option graph again.
    cy.say("travel", "You enter the travel tubes.", { global: true });
    cy.getImageUrl().then((url) => (lastImageUrl = url));

    // Choose a 'room' option that also has an action chain.
    cy.choose("green room", "You travel to the green room");

    // Scene should not have reverted after the first action.
    cy.getSceneLocation().contains("Travel Tubes");
    checkImageChanged(false);

    // Scene should change after the final action.
    cy.choose("Next", "The room's a beautiful forest", { global: true });
    cy.getSceneLocation().contains("Green Room");
    checkImageChanged();

    // The third way of exiting an OptionGraph - by choosing a node with no options - is covered
    // in the Help tests.
  });
});
