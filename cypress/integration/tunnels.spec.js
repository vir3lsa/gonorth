/// <reference types="cypress" />

beforeEach(() => {
  cy.startGame();
});

it("opens cell door with rusty key", () => {
  // Spawn key
  cy.say("debug spawn rusty iron key");
  cy.shows("spawned rusty iron key");
  cy.say("take key");
  cy.say("i");
  cy.showsLast("rusty iron key");

  // Jump to door
  cy.say("debug commence tunnels middleGaol");
  cy.shows("heavy oak door");
  cy.choose("unlock oak door");
  cy.shows("use which item?");
  cy.choose("rusty iron key");
  cy.shows("force the rusty key into the lock");

  // Open the door (and close it again)
  cy.choose("open oak door");
  cy.shows("swings inwards");
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
