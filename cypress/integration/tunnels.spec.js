/// <reference types="cypress" />

describe("tunnels", () => {
  beforeEach(() => {
    cy.startGame();
  });

  it("opens cell door with rusty key", () => {
    // Spawn key
    cy.say("debug spawn rusty iron key", "spawned rusty iron key");
    cy.say("take key");
    cy.say("i");
    cy.showsLast("rusty iron key");

    // Jump to door
    cy.say("debug commence tunnels middleGaol", "heavy oak door");
    cy.choose("unlock oak door", "use which item?");
    cy.choose("rusty iron key", "force the rusty key into the lock");

    // Open the door (and close it again)
    cy.choose("open oak door", "swings inwards");
    cy.choose("close oak door");
    cy.shows("you close");
    cy.choose("open oak door");
    cy.showsLast("swings inwards");

    // Go through the door
    cy.choose("enter room");
    cy.shows("step into the dark chamber");
    cy.choose("next");
    cy.shows("clearly a cell of some kind");

    // Use the door from inside the room
    cy.say("x door");
    cy.shows("solid and imposing");
    cy.say("open door");
    cy.shows("already open");
    cy.say("take door");
    cy.shows("can't see how to take the door");
    cy.say("close door");
    cy.shows("close the heavy oak door");
    cy.say("close door");
    cy.shows("already closed");
    cy.say("open door");
    cy.shows("swings inwards");
  });

  it("opens cell door with potion", () => {
    // Spawn key
    cy.say("debug spawn organic");
    cy.shows("spawned organic");
    cy.say("take organic");
    cy.say("i");
    cy.showsLast("organic dissolution accelerator");

    // Jump to door
    cy.say("debug commence tunnels middleGaol");
    cy.shows("heavy oak door");
    cy.choose("unlock oak door");
    cy.shows("use which item?");
    cy.choose("organic dissolution accelerator");
    cy.shows("pour a good quantity");

    // Go through the door
    cy.choose("close oak door");
    cy.shows("never close again");
    cy.choose("enter room");
    cy.shows("step into the dark chamber");
    cy.choose("next");
    cy.shows("clearly a cell of some kind");

    // Use the door from inside the room
    cy.say("x door");
    cy.shows("not much left of the once sturdy door");
    cy.say("open door");
    cy.shows("already open");
    cy.say("take door");
    cy.shows("can't see how to take the door");
    cy.say("close door");
    cy.shows("never close again");
  });

  it("traverses the tunnels and hides under barrel", () => {
    // Drink potion
    cy.say("debug spawn feline", "spawned feline");
    cy.say("drink feline", "tastes of fish");
    cy.choose("next", "less dark now");
    cy.say("debug event 100", "100 milliseconds");

    // Enter tunnels
    cy.say("west", "Going West");
    cy.choose("next", "downward-sloping stone tunnel");
    cy.choose("next", "solid wooden door");
    cy.choose("next", "sudden drop");

    // Pass the diode
    cy.choose("jump down", "lower yourself over the edge");
    cy.choose("next", "branches left and right");
    cy.choose("go left", "becoming much narrower");
    cy.choose("round bend", "fantastic vaulted spaces");

    // Meet the monster
    cy.choose("go left", "steep, worn steps");
    cy.choose("go round corner", "too tall to be a person");
    cy.choose("next", "starts moving towards you");
    cy.choose("back up stairs", "fly round the bend");

    // Hide
    cy.choose("go round corner");
    cy.choose("go right", "rickety wooden door");
    cy.choose("open rickety door", "swings open limply");
    cy.choose("enter room", "Passing the open door, you");
    cy.choose("Next", "The tiny room is dank and");
    cy.say("x barrel", "It's standing on the jagged");
    cy.say("hide under barrel", "Scrabbling with your fingers");
    cy.choose("Next", "You can see much of the dank");
    cy.choose("wait", "You can see much of the dank");
    cy.choose("wait", "looking for you");
    cy.choose("wait", "hammering heart");
    cy.choose("wait", "given up its hunt");
    cy.choose("leave", "You lift the barrel and");
  });
});
