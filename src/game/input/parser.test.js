import { Room } from "../items/room";
import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { changeInteraction } from "../../redux/gameActions";
import { Parser } from "./parser";
import { Door } from "../items/door";
import { Item } from "../items/item";
import { Verb } from "../verbs/verb";
import { addEffect, addWildcardEffect, initGame, setInventoryCapacity } from "../../gonorth";
import { goToRoom } from "../../utils/lifecycle";
import { PagedText } from "../interactions/text";
import { selectCurrentPage, selectInteraction } from "../../utils/testSelectors";
import { selectRoom } from "../../utils/selectors";
import { Container } from "../items/container";

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let hall, north, south, east, west, door, chair, redBall, blueBall, redBox, blueBox, chairman, cushion, pillar;

const directionTest = async (input, expectedRoom) => {
  const actionPromise = new Parser(input).parse();
  setTimeout(() => selectInteraction().options[0].action());
  await actionPromise;
  expect(selectRoom().name).toBe(expectedRoom);
};

const openDoorTest = async (input) => {
  await new Parser(input).parse();
  expect(door.open).toBe(true);
};

const inputTest = async (input, ...expectedOutput) => {
  await new Parser(input).parse();
  expectedOutput.forEach((output) => expect(selectCurrentPage()).toInclude(output));
};

const regexTest = async (input, ...expectedRegex) => {
  await new Parser(input).parse();
  expectedRegex.forEach((regex) => expect(selectCurrentPage()).toMatch(regex));
};

beforeEach(() => {
  unregisterStore();
  initGame("The Giant's Castle", "", { debugMode: false });
});

describe("parser", () => {
  describe("directions", () => {
    beforeEach(() => {
      hall = new Room("Hall", "grand");
      north = new Room("Garden", "");
      south = new Room("Kitchen", "");
      east = new Room("Scullery", "");
      west = new Room("Pantry", "");
      door = new Door("trapdoor", "", false);
      chair = new Item("chair", "comfy", false, 0, new Verb("sit in"));
      redBall = new Item("red ball", "It's a rouge ball", true);
      blueBall = new Item("blue ball", "It's an azure ball", true);
      redBox = new Item("red box", "red", true);
      blueBox = new Item("blue box", "blue", true, 20);
      pillar = new Item("pillar");
      redBall.aliases = "ball";
      blueBall.aliases = "ball";
      redBox.aliases = "box";
      blueBox.aliases = "box";
      redBox.capacity = 5;
      blueBox.capacity = 5;
      chair.capacity = 5;
      chair.preposition = "in";
      chairman = new Item("chair man", "impressive");
      chairman.aliases = [];
      chairman.capacity = 5;
      cushion = new Item("cushion", "plush", true, 2);
      new Verb("jump on"); // Should add verb to global registry
      door.aliases = ["hatch", "trap door", "door"];
      door.getVerb("open").addAliases("give a shove to");
      pillar.addVerb(
        new Verb.Builder()
          .withName("take")
          .withTest(false)
          .withOnFailure("It's too big")
          .withAliases("grab, snatch")
          .isRemote()
          .build()
      );

      // Add an effect
      redBall.addVerb(
        new Verb.Builder()
          .withName("throw")
          .makePrepositional("at what")
          .withOnSuccess(({ item, other }) => `The ${item.name} hits the ${other.name}.`)
          .build()
      );
      redBall.addVerb(
        new Verb.Builder().withName("hide").makePrepositional("from whom").withOnSuccess("It's hidden.").build()
      );
      addEffect(redBall, chairman, "throw", true, false, "The chair man catches the ball.");
      addWildcardEffect(chairman, "hide", true, false, ({ item }) => `The chair man can't find the ${item.name}.`);
      addEffect(redBall, blueBall, "throw", true, true, "You take careful aim.");
      addWildcardEffect(blueBall, "hide", true, true, "You hide it from the blue ball.");

      hall.setNorth(north);
      hall.setSouth(south);
      hall.setEast(east);
      hall.setWest(west);
      hall.addItems(door, chair, chairman, cushion, redBall, blueBall, redBox, blueBox, pillar);

      goToRoom(hall);
      door.open = false;
      getStore().dispatch(changeInteraction(new PagedText("")));

      if (!hall.items["cushion"]) {
        hall.addItem(cushion);
      }
    });

    it("goes North", () => directionTest("North", "Garden"));
    it("goes South", () => directionTest("South", "Kitchen"));
    it("goes East", () => directionTest("East", "Scullery"));
    it("goes West", () => directionTest("West", "Pantry"));
    it("ignores case", () => directionTest("NORTH", "Garden"));
    it("responds to alias", () => directionTest("forward", "Garden"));
    it("responds to another alias", () => directionTest("left", "Pantry"));
    it("responds to an item alias", () => openDoorTest("open hatch"));
    it("responds when the direction verb is the second word", () => directionTest("go north", "Garden"));
    it("responds when the direction verb is the third word", () => directionTest("now go north", "Garden"));
    it("responds when there are words between verb and item", () => openDoorTest("now open the heavy trap door"));
    it("responds to multi-word verbs", () => openDoorTest("now give a shove to the trapdoor"));
    it("gives a suitable message if the player types nonsense", () =>
      inputTest("feed bread to the ducks", "confusion"));
    it("gives message if verb is recognised but not item", () =>
      inputTest("open fridge", "don't seem able to open that"));
    it("gives message if item doesn't support verb", () =>
      inputTest("sit in door", "can't see how to sit in the door"));
    it("gives message if item found but no verb", () =>
      inputTest("set fire to chair", "can't easily do that to the chair"));
    it("gives message if global verb and local item found", () =>
      inputTest("jump on chair", "can't see how to jump on the chair"));
    it("gives message if global verb and no local item found", () =>
      inputTest("jump on skateboard", "don't seem able to jump on that"));
    it("tries more specific items first", () => inputTest("x chair man", "impressive"));
    it("handles prepositional verbs", () => inputTest("put the cushion in the chair", "cushion in the chair"));
    it("gives feedback when the first item isn't recognised", () =>
      inputTest("put mug in chair", "You can't put that in the chair"));
    it("gives feedback when the second item isn't recognised", () =>
      inputTest("put cushion in sofa", "Put the cushion where?"));
    it("gives feedback when no second item is given", () => inputTest("put cushion", "Put the cushion where?"));
    it("gives feedback when the second item isn't a container, deferring to verb", () =>
      inputTest("put cushion in red ball", "can't put the cushion"));
    it("allows interaction with items inside other items", async () => {
      await inputTest("put cushion in chair", "You put the cushion in the chair");
      await inputTest("take cushion", "the cushion");
    });
    it("takes an item before putting it", () => regexTest("put cushion in chair", /(take|grab|pick up) the cushion/));
    it("takes both items before putting one", () =>
      regexTest("put cushion in red box", /(take|grab|pick up) the cushion/, /(take|grab|pick up) the red box/));
    it("allows rooms to be referred to by name", () => inputTest("x hall", "grand"));
    it("allows rooms to be referred to generically", () => inputTest("x room", "grand"));
    it("allows items to be put on the floor", () =>
      inputTest("put cushion on the floor", "You put the cushion in the Hall"));
    it("asks for clarification of duplicate aliases", () => inputTest("x ball", "Which ball do you mean?"));
    it("chooses the correct item", () => inputTest("x red ball", "It's a rouge ball"));
    it("chooses the correct other item", () => inputTest("x blue ball", "It's an azure ball"));
    it("asks for clarification of duplicate secondary aliases", () =>
      inputTest("put red ball in box", "Which box do you mean?"));
    it("chooses correct secondary item", () => inputTest("put red ball in red box", "red ball in the red box"));
    it("chooses correct other secondary item", () => inputTest("put red ball in blue box", "red ball in the blue box"));
    it("bails if both items are ambiguous", () => inputTest("put ball in box", "You need to be more specific."));
    it("mentions primary duplicate if secondary is defined", () =>
      inputTest("put ball in red box", "Which ball do you mean?"));
    it("disambiguates when duplicates are in the room and the inventory", async () => {
      await inputTest("take red ball", "the red ball");
      await inputTest("x ball", "Which ball do you mean?");
    });
    it("allows the use of verbs with duplicate names", () => inputTest("take pillar", "It's too big"));
    it("uses the interrogative when no indirect item is given", () =>
      inputTest("throw red ball", "Throw the red ball at what?"));
    it("performs standard prepositional verb when there's no effect between the items", () =>
      inputTest("throw red ball at cushion", "The red ball hits the cushion."));
    it("performs standard prepositional verb when there's no effect for that verb", () =>
      inputTest("put red ball in chair man", "put the red ball in the chair man"));
    it("applies an effect when one is registered", () =>
      inputTest("throw red ball at chair man", "The chair man catches the ball."));
    it("applies wildcard effects", () =>
      inputTest("hide red ball from the chair man", "The chair man can't find the red ball."));
    it("applies a pre-verb effect when one is registered, and continues the verb", () =>
      inputTest("throw red ball at blue ball", "You take careful aim", "The red ball hits the blue ball"));
    it("applies wildcard effects", () => inputTest("hide red ball from the blue ball", "You hide it", "It's hidden"));

    describe("auto disambiguation", () => {
      let apple1, apple2;
      beforeEach(() => {
        apple1 = new Item("nice apple", "nice and crunchy", true);
        apple2 = new Item("rotten apple", "squishy and gross", true);
        apple2.addVerb(new Verb("squish", true, "gross juice squeezes out"));
        hall.addItems(apple1, apple2);
      });

      it("auto disambiguates when items are invisible", () => {
        apple1.visible = false;
        return inputTest("take apple", "the rotten apple");
      });

      it("auto disambiguates when items don't support the verb", () =>
        inputTest("squish apple", "gross juice squeezes out"));
    });

    it("records names and aliases when hidden items are revealed", async () => {
      chairman.hidesItems = new Item.Builder("elephant")
        .withVerbs(new Verb.Builder("stroke").makePrepositional("with what").build())
        .build();
      await inputTest("stroke elephant", "don't seem able to stroke that");
      await inputTest("x chair man", "impressive");
      await inputTest("stroke elephant", "Stroke the elephant with what?");
    });

    it("can't take items from transparent but closed containers", () => {
      const glassCabinet = new Container.Builder("glass cabinet").isItemsVisibleFromSelf().isOpen(false).build();
      const trophy = new Item.Builder("trophy").isHoldable().build();

      glassCabinet.addItem(trophy);
      hall.addItem(glassCabinet);

      return inputTest("take trophy", "can't get at it inside the glass cabinet");
    });

    it("fails if a holdable secondary item can't be picked up", async () => {
      setInventoryCapacity(21);
      await regexTest("put cushion in blue box", /(take|grab|pick up) the cushion/);
      expect(selectCurrentPage()).toInclude("don't have enough room for the blue box");
      expect(selectCurrentPage()).not.toMatch(/(take|grab|pick up) the blue box/);
    });

    describe("return values", () => {
      const parse = (input) => new Parser(input).parse();

      it("returns true following a successful action", async () => expect(await parse("open hatch")).toBe(true));
      it("returns false when input is unparsable", async () => expect(await parse("open shop")).toBe(false));
      it("returns false when verb fails", async () => expect(await parse("take trophy")).toBe(false));
    });
  });
});
