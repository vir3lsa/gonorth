/// <reference types="cypress" />

beforeEach(() => {
  cy.startGame();
  cy.say("debug goto bedroom", "witch's lavish bed chamber");
});

it("retrieves and opens the keepsake box", () => {
  cy.say("examine bedside table", "nothing on the table");
  cy.say("x mirror", "entirely like an ordinary mirror");
  cy.say("x dresser", "the dressing table is a lovely thing");
  cy.say("examine dresser in mirror", "made from dark green leaves");
  cy.say("x bedside table in mirror", "there's something on top of it");
  cy.say("x keepsake box", "an impression or a shadow");
  cy.say("x bedside in mirror", "a small keepsake box on it");
  cy.say("take keepsake box", "nothing but thin air");
  cy.say("examine jewellery in mirror", "solidifies in your mind");
  cy.say("x keepsake", "still translucent");
  cy.say("take keepsake box", "nothing but thin air");
  cy.say("x keepsake in mirror", "certain of the box's solidity now");
  cy.say("x bedside", "there's a keepsake box");
  cy.say("x keepsake", "completely solid now");
  cy.say("x keepsake in mirror", "certain of the box's solidity now");
  cy.say("take box", "the keepsake box");
  cy.say("open keepsake box", "lid won't budge");
  cy.say("say miaow");
  cy.choose("next", "an audible click");
  cy.say("open box", "no resistance at all");
  cy.say("x box", "there's a paper bag");
  cy.say("take bag", "the paper bag");
  cy.say("x bag", "what looks like small biscuits");
  cy.say("x biscuits", "smell faintly fishy");
  cy.say("eat biscuit", "swallow it with a grimace");
});
