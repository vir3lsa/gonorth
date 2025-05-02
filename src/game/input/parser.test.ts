import { Room } from "../items/room";
import { unregisterStore } from "../../redux/storeRegistry";
import { Parser } from "./parser";
import { Door } from "../items/door";
import { Item } from "../items/item";
import { Verb } from "../verbs/verb";
import gn, { addEffect, setInventoryCapacity } from "../../gonorth";
import { goToRoom } from "../../utils/lifecycle";
import { selectCurrentPage, selectInteraction } from "../../utils/testSelectors";
import { selectOptions, selectRoom } from "../../utils/selectors";
import { Container } from "../items/container";
import { clearPage } from "../../utils/sharedFunctions";
import { Effect, VerbRelation } from "../../utils/effects";
import { deferAction } from "../../utils/testFunctions";

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let hall: Room,
  north,
  south,
  east,
  west,
  door: Door,
  chair,
  redBall,
  blueBall,
  redBox,
  blueBox,
  chairman: Item,
  cushion,
  pillar;

const directionTest = async (input: string, expectedRoom: string) => {
  const actionPromise = new Parser(input).parse();
  setTimeout(() => selectInteraction().options[0].action());
  await actionPromise;
  expect(selectRoom().name).toBe(expectedRoom);
};

const openDoorTest = async (input: string) => {
  await new Parser(input).parse();
  expect(door.open).toBe(true);
};

const inputTest = async (input: string, ...expectedOutput: string[]) => {
  await new Parser(input).parse();
  expectedOutput.forEach((output) => expect(selectCurrentPage()).toInclude(output));
};

const regexTest = async (input: string, ...expectedRegex: RegExp[]) => {
  await new Parser(input).parse();
  expectedRegex.forEach((regex) => expect(selectCurrentPage()).toMatch(regex));
};

beforeEach(() => {
  unregisterStore();
  gn.init({ title: "The Giant's Castle", goToTitleScreen: false });
});

describe("parser", () => {
  describe("general", () => {
    beforeEach(() => {
      hall = new Room.Builder("Hall").withDescription("grand").build();
      north = new Room.Builder("Garden").build();
      south = new Room.Builder("Kitchen").build();
      east = new Room.Builder("Scullery").build();
      west = new Room.Builder("Pantry").build();
      door = new Door.Builder("trapdoor").isOpen(false).build();
      chair = new Item.Builder("chair").withDescription("comfy").withVerb(new Verb.Builder("sit in")).build();
      redBall = new Item.Builder("red ball").withDescription("It's a rouge ball").isHoldable().build();
      blueBall = new Item.Builder("blue ball").withDescription("It's an azure ball").isHoldable().build();
      redBox = new Item.Builder("red box").withDescription("red").isHoldable().build();
      blueBox = new Item.Builder("blue box").withDescription("blue").isHoldable().withSize(20).build();
      pillar = new Item.Builder("pillar").build();
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
      new Verb.Builder("jump on").build(); // Should add verb to global registry
      door.aliases = ["hatch", "trap door", "door"];
      door.getVerb("open").addAliases("give a shove to");
      pillar.addVerb(
        new Verb.Builder("take")
          .withTest(false, "It's too big")
          .withAliases("grab, snatch")
          .isRemote()
          .build()
      );

      // Add an effect
      redBall.addVerb(
        new Verb.Builder("throw")
          .makePrepositional("at what")
          .onSuccess(({ item, other }) => `The ${item.name} hits the ${other!.name}.`)
          .build()
      );
      redBall.addVerb(new Verb.Builder("hide").makePrepositional("from whom").onSuccess("It's hidden.").build());
      // Verb with alias "put" to verify that canonical verb names are no longer used in feedback.
      blueBall.addVerb(
        new Verb.Builder("club").withAliases("put").onSuccess("You hit the ball into the hole.").build()
      );
      addEffect(
        new Effect.Builder()
          .withPrimaryItem(redBall)
          .withSecondaryItem(chairman)
          .withVerbName("throw")
          .isSuccessful()
          .withVerbRelation(VerbRelation.Instead)
          .withActions("The chair man catches the ball.")
      );
      addEffect(
        new Effect.Builder()
          .withAnyPrimaryItem()
          .withSecondaryItem(chairman)
          .withVerbName("hide")
          .isSuccessful()
          .withVerbRelation(VerbRelation.Instead)
          .withActions(({ item }) => `The chair man can't find the ${item.name}.`)
      );
      addEffect(
        new Effect.Builder()
          .withPrimaryItem(redBall)
          .withSecondaryItem(blueBall)
          .withVerbName("throw")
          .isSuccessful()
          .withVerbRelation(VerbRelation.Before)
          .withActions("You take careful aim.")
      );
      addEffect(
        new Effect.Builder()
          .withAnyPrimaryItem()
          .withSecondaryItem(blueBall)
          .withVerbName("hide")
          .isSuccessful()
          .withVerbRelation(VerbRelation.Before)
          .withActions("You hide it from the blue ball.")
      );

      // Add a prepositional verb with subject and object reversed.
      redBox.addVerb(
        new Verb.Builder("store")
          .makePrepositional("store what in the red box?")
          .onSuccess(({ other }) => `You store the ${other!.name} in the red box`)
      );

      hall.setNorth(north);
      hall.setSouth(south);
      hall.setEast(east);
      hall.setWest(west);
      hall.addItems(door, chair, chairman, cushion, redBall, blueBall, redBox, blueBox, pillar);

      goToRoom(hall);
      door.open = false;
      clearPage();

      if (!hall.items["cushion"]) {
        hall.addItem(cushion);
      }
    });

    describe("directions", () => {
      it("goes north", () => directionTest("north", "Garden"));
      it("goes south", () => directionTest("south", "Kitchen"));
      it("goes east", () => directionTest("east", "Scullery"));
      it("goes west", () => directionTest("west", "Pantry"));
      it("ignores case", () => directionTest("NORTH", "Garden"));
      it("responds to alias", () => directionTest("forward", "Garden"));
      it("responds to another alias", () => directionTest("left", "Pantry"));
      it("responds to an item alias", () => openDoorTest("open hatch"));
      it("responds when the direction verb is the second word", () => directionTest("go north", "Garden"));
      it("responds when the direction verb is the third word", () => directionTest("now go north", "Garden"));
    });

    it("responds when there are words between verb and item", () => openDoorTest("now open the heavy trap door"));
    it("responds to multi-word verbs", () => openDoorTest("now give a shove to the trapdoor"));
    it("gives a suitable message if the player types nonsense", () =>
      inputTest("feed bread to the ducks", "That's not something you can do."));
    it("gives message if verb is recognised but not item", () => inputTest("open fridge", "can't open that"));
    it("gives message if item doesn't support verb", () => inputTest("sit in door", "can't sit in the door"));
    it("gives message if item found but no verb", () => inputTest("set fire to chair", "can't do that to the chair"));
    it("gives message if global verb and local item found", () =>
      inputTest("jump on chair", "can't jump on the chair"));
    it("gives message if global verb and no local item found", () =>
      inputTest("jump on skateboard", "can't jump on that"));
    it("gives message if registered verb and object elsewhere", async () => {
      await inputTest("debug goto pantry", "");
      await inputTest("take red ball", "The red ball isn't here");
    });
    it("tries more specific items first", () => inputTest("x chair man", "impressive"));

    describe("involving cushion", () => {
      beforeEach(() => inputTest("take cushion", "the cushion"));
      it("handles prepositional verbs", () => inputTest("put the cushion in the chair", "cushion in the chair"));
      it("allows interaction with items inside other items", async () => {
        await inputTest("put cushion in chair", "You put the cushion in the chair");
        await inputTest("take cushion", "the cushion");
      });
      it("allows rooms to be referred to by name", () => inputTest("x hall", "grand"));
      it("allows rooms to be referred to generically", () => inputTest("x room", "grand"));
      it("allows items to be put on the floor", () =>
        inputTest("put cushion on the floor", "You put the cushion on the floor"));
      it("allows items to be dropped", () => inputTest("drop cushion", "You put the cushion on the floor"));
    });

    describe("auto actions", () => {
      const takeCushionRegex = /(take|grab|pick up) the cushion/;

      it("takes an item before putting it", () => {
        new Parser("put cushion in chair").parse();
        return deferAction(() => expect(selectCurrentPage()).toMatch(takeCushionRegex));
      });
      it("takes both items before putting one", () => {
        const parserPromise = new Parser("put cushion in red box").parse();
        return deferAction(async () => {
          expect(selectCurrentPage()).toMatch(takeCushionRegex);
          await selectOptions()[0].action(); // Click Next.
          await parserPromise;
          expect(selectCurrentPage()).toMatch(/(take|grab|pick up) the red box/);
          ;
        })
      });
    })

    describe("involving red ball and red box", () => {
      beforeEach(() => {
        inputTest("take red ball", "the red ball");
        inputTest("take blue ball", "the blue ball");
        inputTest("take red box", "the red box");
      });
      it("asks for clarification of duplicate aliases", () => inputTest("x ball", "Which ball do you mean?"));
      it("chooses the correct item", () => inputTest("x red ball", "It's a rouge ball"));
      it("chooses the correct other item", () => inputTest("x blue ball", "It's an azure ball"));
      it("asks for clarification of duplicate secondary aliases", () =>
        inputTest("put red ball in box", "Which box do you mean?"));
      it("chooses correct secondary item", () => inputTest("put red ball in red box", "red ball in the red box"));
      it("chooses correct other secondary item", () => {
        inputTest("take blue box", "the blue box");
        inputTest("put red ball in blue box", "red ball in the blue box");
      });
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
      it("performs standard prepositional verb when there's no effect between the items", () => {
        inputTest("take cushion", "the cushion");
        inputTest("throw red ball at cushion", "The red ball hits the cushion.")
      });
      it("performs standard prepositional verb when there's no effect for that verb", () =>
        inputTest("put red ball in chair man", "put the red ball in the chair man"));
      it("applies an effect when one is registered", () =>
        inputTest("throw red ball at chair man", "The chair man catches the ball."));
      it("applies wildcard effects", () =>
        inputTest("hide red ball from the chair man", "The chair man can't find the red ball."));
      it("applies a pre-verb effect when one is registered, and continues the verb", () =>
        inputTest("throw red ball at blue ball", "You take careful aim", "The red ball hits the blue ball"));
      it("applies wildcard effects", () => inputTest("hide red ball from the blue ball", "You hide it", "It's hidden"));
      it("performs reversed prepositional verbs", () =>
        inputTest("store red ball in red box", "You store the red ball in the red box"));
    });

    it("records names and aliases when hidden items are revealed", async () => {
      chairman.hidesItems = new Item.Builder("elephant")
        .withVerbs(new Verb.Builder("stroke").makePrepositional("with what").build())
        .build();
      await inputTest("stroke elephant", "can't stroke that");
      await inputTest("x chair man", "impressive");
      await inputTest("stroke elephant", "Stroke the elephant with what?");
    });

    it("can't take items from transparent but closed containers", () => {
      const glassCabinet = new Container.Builder("glass cabinet").isTransparent().isOpen(false).build();
      const trophy = new Item.Builder("trophy").isHoldable().build();

      glassCabinet.addItem(trophy);
      hall.addItem(glassCabinet);

      return inputTest("take trophy", "can't get at it inside the glass cabinet");
    });

    it("fails if a holdable secondary item can't be picked up", async () => {
      setInventoryCapacity(21);
      await regexTest("take cushion", /(take|grab|pick up) the cushion/);
      await inputTest("put cushion in blue box", "don't have enough room for the blue box");
      expect(selectCurrentPage()).not.toMatch(/(take|grab|pick up) the blue box/);
    });

    describe("return values", () => {
      const parse = (input: string) => new Parser(input).parse();

      it("returns true following a successful action", async () => expect(await parse("open hatch")).toBe(true));
      it("returns false when input is unparsable", async () => expect(await parse("open shop")).toBe(false));
      it("returns false when verb fails", async () => expect(await parse("take trophy")).toBe(false));
    });

    describe("feedback", () => {
      beforeEach(async () =>
        await new Parser("take cushion").parse());
      it("gives feedback when the first item isn't recognised", () =>
        inputTest("put mug in chair", "You can't put that in the chair"));
      it("gives feedback when the second item isn't recognised", () =>
        inputTest("put cushion in sofa", "Put the cushion where?"));
      it("gives feedback when no second item is given", () => inputTest("put cushion", "Put the cushion where?"));
      it("gives feedback when the second item isn't a container, deferring to verb", async () => {
        await new Parser("take red ball").parse();
        inputTest("put cushion in red ball", "can't put the cushion");
      });
      it("converts x to examine when the item doesn't exist", async () => {
        await inputTest("x flower", "You can't examine that");
        await inputTest("look flower", "You can't examine that");
        await inputTest("ex flower", "You can't examine that");
      });
      it("converts x to examine when the item exists elsewhere", () => {
        goToRoom("Pantry");
        inputTest("x red ball", "you can't examine it");
      });
    });

    describe("disambiguation", () => {
      let apple1: Item, apple2: Item;
      beforeEach(() => {
        apple1 = new Item("nice apple", "nice and crunchy", true);
        apple2 = new Item("rotten apple", "squishy and gross", true);
        apple2.addVerb(new Verb.Builder("squish").isRemote().onSuccess("gross juice squeezes out"));
        hall.addItems(apple1, apple2);
      });

      it("auto disambiguates when items are invisible", () => {
        apple1.visible = false;
        return inputTest("take apple", "the rotten apple");
      });

      it("auto disambiguates when items don't support the verb", () =>
        inputTest("squish apple", "gross juice squeezes out"));

      it("auto disambiguates when an item take precedence", () => {
        apple1.hasParserPrecedence = true;
        return inputTest("take apple", "the nice apple");
      });

      it("doesn't auto disambiguate if more than one item take precedence", () => {
        apple1.takeParserPrecedence = true;
        apple2.takeParserPrecedence = true;
        return inputTest("take apple", "Which apple");
      });

      it("removes Markdown syntax when disambiguating", async () => {
        apple1.name = "*nice apple*";
        apple2.name = "**rotten apple**";
        await inputTest("take apple", "Which apple");
        expect(selectOptions()[0].label).toBe("nice apple");
        expect(selectOptions()[1].label).toBe("rotten apple");
      });

      it("doesn't remove non-Markdown syntax", async () => {
        apple1.name = "*nice apple";
        apple2.name = "++rotten apple++";
        await inputTest("take apple", "Which apple");
        expect(selectOptions()[0].label).toBe("*nice apple");
        expect(selectOptions()[1].label).toBe("++rotten apple++");
      });
    });
  });
});
