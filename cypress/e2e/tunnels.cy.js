/// <reference types="cypress" />

describe("tunnels", () => {
  beforeEach(() => {
    cy.startGame();
  });

  it("opens cell door with rusty key", () => {
    // Spawn key
    cy.say("take pale");
    cy.say("debug spawn rusty iron key", "spawned rusty iron key");
    cy.say("take key");
    cy.say("i");
    cy.showsLast("rusty iron key");
    cy.showsLast("pale");

    // Jump to door
    cy.say("debug commence tunnels middleGaol", "heavy oak door");
    cy.choose("unlock oak door", "use which item?");
    cy.choose("pale", "You're not going to be able to open the door with the pale.");
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
    cy.say("debug spawn feline", "spawned feline");
    cy.say("take organic");
    cy.say("take feline");
    cy.say("i");
    cy.showsLast("organic dissolution accelerator");
    cy.showsLast("philtre of feline vision");

    // Jump to door
    cy.say("debug commence tunnels middleGaol");
    cy.shows("heavy oak door");
    cy.choose("unlock oak door");
    cy.shows("use which item?");
    cy.choose("philtre of feline vision", "philtre of feline vision splashes onto the door");
    cy.choose("unlock oak door");
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
    cy.say("debug event 0", "0 milliseconds");

    // Enter tunnels
    cy.say("west", "Going West");
    cy.choose("next", "downward-sloping stone tunnel");
    cy.choose("next", "solid wooden door");
    cy.choose("next", "sudden drop");

    // Pass the diode
    cy.choose("jump down", "lower yourself over the edge");
    cy.choose("next", "branches left and right");
    cy.choose("go left", "becoming much narrower");

    // Open the door to the room, ready for the chase later
    cy.choose("open rickety door", "swings open limply");
    cy.choose("round bend", "fantastic vaulted spaces");

    // Meet the monster
    cy.choose("go left", "steep, worn steps");
    cy.choose("go round corner", "too tall to be a person");
    cy.choose("next", "starts moving towards you");
    cy.choose("back up stairs", "fly round the bend", "cry of agony");

    // Hide
    cy.choose("go round corner", "awful moaning cry");
    cy.choose("go right", "rickety wooden door", "Strain your ears");
    cy.choose("enter room", "Passing the open door, you");
    cy.choose("Next", "The tiny room is dank and", "Whimpering cries emanate", { global: true });
    cy.say("x barrel", "It's standing on the jagged", "heart-stopping wail");
    cy.say("hide under barrel", "Scrabbling with your fingers");
    cy.choose("Next", "You can see much of the dank", "looking for you");
    cy.choose("wait", "You can see much of the dank", "hammering heart");
    cy.choose("wait", "given up its hunt");
    cy.choose("leave", "You lift the barrel and");
  });

  it("hides from the monster in the well", () => {
    cy.say("debug event 100", "100 milliseconds");
    cy.say("debug commence tunnels meetTheMonster", "Beyond the bend the corridor");
    cy.choose("Next", "Without a sound, it starts");
    cy.choose("go round corner", "bound up the stairs");
    cy.choose("go round corner", "ceiling lifts away");
    cy.choose("straight on", "carved wooden door");
    cy.choose("open carved door", "Lifting an iron latch, you");
    cy.choose("enter room", "Passing the now open door,");
    cy.choose("Next", "In the centre of the room", { global: true });
    cy.say("x well", "The circular wall around the");
    cy.say("hide in well", "First you hop up onto the");
    cy.choose("descend further", "You slide further down the");
    cy.choose("descend further", "You climb down ever further,");
    cy.choose("search water", "Plunging your hand into the");
    cy.choose("wait", "The sound of your breathing");
    cy.choose("wait", "Your arms are aching terribly");
    cy.choose("climb out", "You haul yourself back up the");
  });

  const reloadTextRegex = /(get to your feet|just a bad dream|find yourself back)/;

  it("gets caught by the monster in the tunnels and loads a checkpoint", () => {
    cy.say("debug event 10", "10 milliseconds");
    cy.say("take pale", "the pale");
    cy.say("x", "smells of rotting Earth", { global: true });
    cy.say("debug commence tunnels meetTheMonster", "Beyond the bend the corridor");
    cy.choose("Next", "Without a sound, it starts");
    cy.choose("go round corner", "bound up the stairs");
    cy.choose("go round corner", "ceiling lifts away");
    cy.choose("go right", "rickety wooden door");
    cy.choose("open rickety door", "swings open limply");
    cy.shows("shadows seem to loom up");
    cy.choose("next", "GAME OVER", { global: true });
    cy.choose("reload checkpoint", reloadTextRegex, { global: true });
    cy.choose("next", "smells of rotting Earth", { global: true });

    // Check the monster chases and catches you again.
    cy.say("debug event 1", "1 milliseconds");
    cy.say("i", "pale");
    cy.say("debug commence tunnels meetTheMonster", "Beyond the bend the corridor");
    cy.choose("Next", "Without a sound, it starts");
    cy.choose("back up stairs", "right behind you");
    cy.choose("go round corner", "hot on your tail");
    cy.choose("go right", "glance over your shoulder");
    cy.choose("open rickety door", "shadows seem to loom up");
    cy.choose("next", "GAME OVER", { global: true });
  });

  it("gets caught by the monster in a room and starts a new game", () => {
    cy.say("debug event 100", "100 milliseconds");
    cy.say("take pale", "pale");
    cy.say("x", "smells of rotting Earth", { global: true });
    cy.say("debug commence tunnels meetTheMonster", "Beyond the bend the corridor");
    cy.choose("Next", "Without a sound, it starts");
    cy.choose("go round corner", "bound up the stairs");
    cy.choose("go round corner", "ceiling lifts away");
    cy.choose("go right", "rickety wooden door");
    cy.choose("open rickety door", "swings open limply");
    cy.choose("enter room", "Passing the open door, you");
    cy.choose("Next", "The tiny room is dank and", { global: true });
    cy.say("x barrel", "edges of the wooden staves");
    cy.say("hide under barrel", "Scrabbling with your fingers");
    cy.choose("Next", "You can see much of the dank");
    cy.shows("heart-stopping wail");
    cy.choose("leave", "You lift the barrel and");
    cy.shows("in the room with you");
    cy.choose("next", "GAME OVER", { global: true });
    cy.choose("return to main menu", "lady of bramble", { global: true });

    // The monster should chase you again after starting a new game.
    cy.newGame();
    cy.say("i", /(holding anything|carrying anything|got nothing|hands are empty)/);
    cy.say("debug commence tunnels meetTheMonster", "Beyond the bend the corridor");
    cy.choose("Next", "Without a sound, it starts");
  });
});
