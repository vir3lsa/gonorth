/// <reference types="cypress" />

describe("apothecary", () => {
  beforeEach(() => {
    cy.startGame();
    cy.say("debug goto apothecary", "apothecary or decoction room", { global: true });
  });

  it("reads the grimoire", () => {
    cy.say("x bookshelf", "The shelves are full of");
    cy.say("take grimoire", "the grimoire");
    cy.say("x grimoire", "It's a sturdy tome bound in");
    cy.say("read grimoire", "You carefully open the dusty");
    cy.choose("Next", "As you do so, a scrap of");
    cy.choose("Next", "Elixir of Mending", { element: "h2" });
    cy.choose("Next page", "Organic Dissolution Accelerator", { element: "h2" });
    cy.choose("Next page", "Auto-Refractive Tincture", { element: "h2" });
    cy.choose("Next page", "Elixir of Might", { element: "h2" });
    cy.choose("Next page", "Sleeping Draught", { element: "h2" });
    cy.choose("Next page", "Philtre of Feline Vision", { element: "h2" });
    cy.choose("Previous page", "Sleeping Draught", { element: "h2" });
    cy.choose("Previous page", "Elixir of Might", { element: "h2" });
    cy.choose("Previous page", "Auto-Refractive Tincture", { element: "h2" });
    cy.choose("Previous page", "Organic Dissolution Accelerator", { element: "h2" });
    cy.choose("Previous page", "Elixir of Mending", { element: "h2" });
    cy.choose("Stop reading", "You close the grimoire");
  });

  it("messes about with the cauldron and the pipes", () => {
    cy.say("x jars", "This must be the witch's");
    cy.say("take vervain", "the Vervain");
    cy.say("i", "You're carrying Vervain");
    cy.say("add vervain to cauldron", "You put some Vervain in the");
    cy.say("add vervain to cauldron", "You put some Vervain in the");
    cy.say("flush cauldron", "There's no liquid in the");
    cy.say("x pipes", "There's a spout above the");
    cy.say("open valve", "You grab the crank wheel with");
    cy.say("drain cauldron", "You spin the wheel that opens");
    cy.say("close valve", "You spin the valve wheel back");
    cy.say("drain cauldron", "You spin the wheel that opens");
  });

  it("creates the woodworm potion and uses it to open the desk", () => {
    cy.say("x pipes", "There's a spout above the");
    cy.say("open valve", "You grab the crank wheel with");
    cy.shows("quarter full");
    cy.say("wait", "half full");
    cy.choose("Stop waiting");
    cy.say("close valve", "You spin the valve wheel back");
    cy.say("x jars", "This must be the witch's");
    cy.say("add cockroach to cauldron", "You put some Cockroach Saliva");
    cy.say("add horehound to cauldron", "You put some Horehound in the");
    cy.say("stir cauldron with ladle", "begin to react");
    cy.choose("Keep stirring", "gloopy consistency");
    cy.choose("Keep stirring", "deep crimson colour");
    cy.choose("Stop stirring");
    cy.say("add wormwood to cauldron", "You put some Wormwood in the");
    cy.shows("tendrils of steam");
    cy.say("x cauldron", "luminous green");
    cy.say("take potion", "You grab an empty vial from");
    cy.say("pour organic on desk", "You carefully pour a droplet");
    cy.choose("Next", "You tip the entire contents");
    cy.say("x desk", "The right-hand side of the");
    cy.say("x drawers", "The drawers still don't open");
    cy.say("take matchbook", "the matchbook");
    cy.say("x matchbook", "It's an old-fashioned");
  });

  it("creates an elixir of mending", () => {
    cy.say("debug spawn matches", "Spawned matches in Apothecary");
    cy.say("take matches", "the matchbook");
    cy.say("x pipes", "There's a spout above the");
    cy.say("open valve", "You grab the crank wheel with");
    cy.say("x jars", "This must be the witch's");
    cy.say("wait");
    cy.choose("Keep waiting");
    cy.choose("Stop waiting");
    cy.say("close valve", "You spin the valve wheel back");
    cy.say("add dryad's toenails to cauldron", "Nothing's happening just yet");
    cy.say("put alfalfa in pot", "smells a bit strange");
    cy.say("add white sage to pot", "pale white colour now");
    cy.say("light fire with matches", "Striking one of the big");
    cy.say("stir pot with ladle", "mixture still smells bad");
    cy.choose("Keep stirring", "darkening now");
    cy.choose("Keep stirring", "colour of a fresh bruise");
    cy.choose("Stop stirring");
    cy.say("put out fire", "You pull the metal cover over");
    cy.say("x cauldron", "A large cast-iron pot that", "dark bruise");
    cy.say("take potion", "You grab an empty vial from");
    cy.say("x potion", "Which potion do you");
    cy.choose("Elixir of Mending", "deep purple in colour");
  });
});
