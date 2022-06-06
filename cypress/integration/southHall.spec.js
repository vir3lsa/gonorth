/// <reference types="cypress" />

describe("South Hall", () => {
  beforeEach(() => {
    cy.startGame();
    cy.say("debug goto south hall", "You find yourself in a long", { global: true });
  });

  const turnWeaponRegex = /(Gripping the spear shaft|twist the weapon|rotate the heavy)/;
  const turnHandRegex = /(push the hand|mechanical whirring|moves easily)/;
  const handWontTurnRegex = /(won't turn|doesn't want to budge|stuck|can't seem to turn)/;
  const nextClockStageRegex = /(bong|chimes)/;

  it("solves the armour puzzle", () => {
    cy.say("x armour", "It's a full metal suit of");
    cy.say("x halberd", "It's taller than the suit of");
    cy.say("take halberd", "The gauntleted hand is");
    cy.say("turn halberd", "Turn the halberd which way?");
    cy.say("turn halberd anticlockwise", turnWeaponRegex);
    cy.say("turn weapon anticlockwise", turnWeaponRegex);
    cy.say("turn ax clockwise", turnWeaponRegex);
    cy.say("turn halberd anticlockwise", turnWeaponRegex);
    cy.say("turn halberd anticlockwise", turnWeaponRegex);
    cy.say("turn halberd anticlockwise", turnWeaponRegex);
    cy.say("rotate weapon clock", "The halberd will only rotate");
    cy.say("rotate weapon clockwise", "After giving the halberd one");
    cy.choose("Next", "the helmet's visor slides up");

    // Can't turn the halberd any more.
    cy.say("turn axe clockwise", "Having already activated the");
    cy.say("turn axe anticlockwise", "Having already activated the");
  });

  it("resets the armour puzzle when it's failed", () => {
    cy.say("x armour", "It's a full metal suit of");
    cy.say("turn halberd anticlockwise", turnWeaponRegex);
    cy.say("turn halberd anticlockwise", turnWeaponRegex);
    cy.say("turn halberd anticlockwise", "A clang and a whirring of");
    cy.say("turn halberd anticlockwise", turnWeaponRegex);
    cy.say("turn halberd anticlockwise", turnWeaponRegex);
  });

  it("finds the puzzle solution via the clock", () => {
    cy.say("x clock", "Easily twice your height, the");
    cy.say("x hand", "The single hand is wrought in");
    cy.say("take hand", "The hand's attached to the");
    cy.say("turn hand", "Turn the hand which way?");
    cy.say("turn hand clockwise", handWontTurnRegex);
    cy.say("turn hand anticlockwise", turnHandRegex);
    cy.say("turn hand clockwise", handWontTurnRegex);
    cy.say("turn hand anticlockwise", turnHandRegex, nextClockStageRegex);
    cy.say("turn hand anticlockwise", handWontTurnRegex);
    cy.say("turn hand clockwise", turnHandRegex, nextClockStageRegex);
    cy.say("turn hand clockwise", handWontTurnRegex);
    cy.say("turn hand anticlockwise", turnHandRegex);
    cy.say("turn hand anticlockwise", turnHandRegex);
    cy.say("turn hand clockwise", handWontTurnRegex);
    cy.say("turn hand anticlockwise", turnHandRegex, nextClockStageRegex);
    cy.say("turn hand anticlockwise", handWontTurnRegex);
    cy.say("turn hand clockwise", "Without warning, a door above");
    cy.choose("Next", "One of the figures lowers its");
    cy.choose("Next", "Once the scene is over, the");
    cy.choose("Next", "You wonder whether to hide.");
  });
});
