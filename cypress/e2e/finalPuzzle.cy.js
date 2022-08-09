/// <reference types="cypress" />

describe("final puzzle", () => {
  beforeEach(() => {
    cy.startGame();
  });

  it("solves the final puzzle", () => {
    cy.say("debug goto snug", "cozy snug or cubby", { global: true });
    cy.say("x fireplace", "A roaring fire must have been");
    cy.say("x log basket", "A wicker basket with two big");
    cy.say("take wagon", "the toy wagon");
    cy.say("x wagon", "It's quite a lovely thing,");
    cy.say("i", "You're carrying a toy wagon");
    cy.say("e", "Parting the bead strands with");
    cy.choose("Next", "The room is long and thin and", { global: true });
    cy.say("e", "Going East");
    cy.choose("Next", "The witch's kitchen would", { global: true });
    cy.say("e", "The door is extremely solid");
    cy.say("open door", "Which door do you");
    cy.choose("sturdy door", "You reach up to the iron");
    cy.say("e", "You step through the doorway,");
    cy.choose("Next", "This is plainly the grotto's", { global: true });
    cy.say("s", "Going South");
    cy.choose("Next", "You find yourself in a long", { global: true });
    cy.say("e", "Going East");
    cy.choose("Next", "You begin climbing the long,");
    cy.say("u", "Going Up");
    cy.choose("Next", "You continue trudging");
    cy.say("u", "Going Up");
    cy.choose("Next", "You keep expecting to see a");
    cy.say("u", "Going Up");
    cy.choose("Next", "The monotony of the");
    cy.say("x graffiti", "On closer inspection, it's");
    cy.say("turn around", "You turn around to face the");
    cy.say("u", "You carefully lift your left");
    cy.choose("Next", "You've reached the witch's", { global: true });

    // Examine the wagon in the mirror.
    cy.say("x mirror", "At first glance it appears");
    cy.say("x wagon in mirror", "In the mirror's magical");
    cy.say("x wagon", "It's a fuzzy blur of colours");
    cy.say("x wagon in mirror", "That other shape hidden");
    cy.choose("Next", "It's a toy boat - a tiny");
    cy.choose("Next", "You can see the boat with");
    cy.say("i", "You're carrying a toy boat");
    cy.say("x boat", "A charming model of a wooden");

    // Fix the boat.
    cy.say("debug spawn elixir of mending", "Spawned elixir of mending in");
    cy.say("x elixir", "The substance inside the");
    cy.say("pour elixir on boat", "You douse the toy boat with");
    cy.choose("Next", "For a heart-stopping moment,");
    cy.choose("Next", "As the fibres meet, they");
    cy.choose("Next", "The boat is mended, as good");
    cy.say("x boat", "A charming model of a wooden", "fully repaired");
  });

  it("automatically leaves the boat", () => {
    cy.say("debug goto apothecary", "You seem to be in some kind", { global: true });
    cy.say("debug spawn toy boat", "Spawned toy boat in");
    cy.say("debug variable store toyBoatMended true", "Variable stored");
    cy.say("debug variable store playerTiny true", "Variable stored");
    cy.say("board boat", "You're now the perfect size");

    // Remote verbs don't cause you to leave the boat.
    cy.say("x pipes", "There's a spout above the");

    // Non-remote ones do.
    cy.say("turn dial", "You clamber out of the boat", "You turn the dial");
  });
});
