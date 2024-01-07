/// <reference types="cypress" />
import packageJson from "../../package.json";

const expectedFeedbackObj = {
  feedback: "I clicked stuff",
  name: "Rich",
  logs: [
    {
      output: [
        `##### GoNorth v${packageJson.version}&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;The White Room v0.0.1\n# The White Room\n### By Rich Locke\n\nChoose: play`
      ]
    },
    {
      input: "[play]",
      output: [
        "",
        "You awaken slowly, as if from the deepest sleep, and gradually become aware that something is very wrong.\n\nChoose: Next"
      ]
    },
    {
      input: "[Next]",
      output: ["You realise you have no idea where you are and no memory of how you got here.", "Choose: Next"]
    },
    {
      input: "[Next]",
      output: [
        "",
        "",
        'The game you\'re playing, The White Room, is a work of interactive fiction, meaning that for much of the game you will be presented with a text box asking "What do you want to do?" You should answer that question by typing commands into the box and pressing `Enter`. The game will do its best to interpret what you typed and act accordingly.\n\nChoose: next, cancel help'
      ]
    },
    {
      input: "[cancel help]",
      output: [
        'To view these help pages again, type "help".\n\nGood luck, and have fun.\n\nChoose: Next',
        "Choose: Next"
      ]
    },
    {
      input: "[Next]",
      output: [
        "The room you find yourself in is a nearly perfect cube. It gleams a futuristic white, each surface emitting a soft, uniform glow. There are no shadows at all.\n\nIn front of you, there's a pedestal topped by a single red button. To your right, there's an almost identical green one.\n\nThere's a flat object at about waist height that could be a table.\n\nCorridors to the east and west lead to other rooms.\n\nYou also see a strange device, an apple, an orange, and a large object."
      ]
    }
  ]
};

const expectedRollingFeedback = {
  feedback: "I took the apple",
  name: "John",
  logs: [
    {
      input: "[cancel help]",
      output: [
        'To view these help pages again, type "help".\n\nGood luck, and have fun.\n\nChoose: Next',
        "Choose: Next"
      ]
    },
    {
      input: "[Next]",
      output: [
        "The room you find yourself in is a nearly perfect cube. It gleams a futuristic white, each surface emitting a soft, uniform glow. There are no shadows at all.\n\nIn front of you, there's a pedestal topped by a single red button. To your right, there's an almost identical green one.\n\nThere's a flat object at about waist height that could be a table.\n\nCorridors to the east and west lead to other rooms.\n\nYou also see a strange device, an apple, an orange, and a large object."
      ]
    },
    {
      input: "x device",
      output: [
        "It's a sleek metal object that fits neatly in your hand. There's a dial on one side and a trigger underneath. It's set to stun."
      ]
    },
    {
      input: "take device",
      output: ["You grab the strange device."]
    },
    {
      input: "take apple",
      output: ["You pick up the apple."]
    },
    {
      input: "i",
      output: ["You're carrying a strange device and an apple."]
    },
    {
      input: "e",
      output: ["Going east.\n\nChoose: Next"]
    },
    {
      input: "[Next]",
      output: [
        "This room is much like the white room, all featureless glowing surfaces and no windows, but the light being emitted from the unnaturally smooth floor, walls and ceiling is blood red.\n\nThe white room lies to the west."
      ]
    },
    {
      input: "w",
      output: ["Going west.\n\nChoose: Next"]
    },
    {
      input: "[Next]",
      output: [
        "The room you find yourself in is a nearly perfect cube. It gleams a futuristic white, each surface emitting a soft, uniform glow. There are no shadows at all.\n\nIn front of you, there's a pedestal topped by a single red button. To your right, there's an almost identical green one.\n\nThere's a flat object at about waist height that could be a table.\n\nCorridors to the east and west lead to other rooms.\n\nYou also see an orange and a large object."
      ]
    }
  ]
};

describe("feedback component", () => {
  beforeEach(() => {
    cy.startGame({ monitorConsole: true });
  });

  it("opens and sends feedback", () => {
    cy.choose("Feedback");

    // The submit button should be disabled.
    cy.contains("button", "Submit").should("be.disabled");
    cy.get("textarea").first().type("I clicked stuff");

    // The submit button should now be enabled.
    cy.contains("button", "Submit").should("not.be.disabled");
    cy.get("input").eq(1).type("Rich");
    cy.choose("Submit");

    // Submit should be disabled again.
    cy.contains("button", "Submit").should("be.disabled");

    // Check the feedback callback function was invoked with the expected arguments.
    cy.get("@consoleLog").should("be.calledWith", expectedFeedbackObj);

    // Changing the feedback should enable the submit button again.
    cy.get("textarea").first().type("!");
    cy.contains("button", "Submit").should("not.be.disabled");

    // Returning to the original feedback should disable the button again.
    cy.get("textarea").first().type("{backspace}");
    cy.contains("button", "Submit").should("be.disabled");

    // Changing the name should enable the submit button again.
    cy.get("input").eq(1).type("ard");
    cy.contains("button", "Submit").should("not.be.disabled");

    // Returning to the original name should disable the button again.
    cy.get("input").eq(1).type("{backspace}{backspace}{backspace}");
    cy.contains("button", "Submit").should("be.disabled");
  });

  it("sends a rolling window of 10 logs", () => {
    // Perform some loggable actions.
    cy.say("x device", "It's a sleek metal object");
    cy.say("take device", "You grab the strange device");
    cy.say("take apple", "You pick up the apple");
    cy.say("i", "You're carrying a strange");
    cy.say("e", "Going east");
    cy.choose("Next", "This room is much like the", { global: true });
    cy.say("w", "Going west");
    cy.choose("Next", "The room you find yourself in", { global: true });

    // Submit feedback.
    cy.choose("Feedback");
    cy.get("textarea").first().type("I took the apple");
    cy.get("input").eq(1).type("John");
    cy.choose("Submit");

    // Check the feedback callback function was invoked with the expected arguments.
    cy.get("@consoleLog").should("be.calledWith", expectedRollingFeedback);
  });
});
