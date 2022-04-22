import { initGame } from "../../gonorth";
import { newGame } from "../../redux/gameActions";
import { initStore } from "../../redux/store";
import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { Container } from "./container";

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let game;

beforeEach(() => {
  unregisterStore();
  initStore();

  // Pretend we're in the browser
  game = initGame("Jolly Capers", "", { debugMode: false });
  getStore().dispatch(newGame(game, true, false));
});

describe("serialization", () => {
  let box;

  const expectRecordedProperties = (item, ...properties) => {
    expect(item._alteredProperties).toEqual(new Set([...properties]));
  };

  beforeEach(() => {
    box = new Container("box", null, "a cardboard box", "tatty and brown", false);
  });

  test("initially no properties are considered altered", () => {
    expectRecordedProperties(box);
  });

  test("changes to open are recorded", () => {
    box.open = true;
    expectRecordedProperties(box, "open");
  });

  test("changes to locked are recorded", () => {
    box.locked = true;
    expectRecordedProperties(box, "locked");
  });

  test("changes to openText are recorded", () => {
    box.openText = "it opens";
    expectRecordedProperties(box, "openText");
  });

  test("changes to lockedText are recorded", () => {
    box.lockedText = "it be locked";
    expectRecordedProperties(box, "lockedText");
  });

  test("changes to closeText are recorded", () => {
    box.closeText = "it closes";
    expectRecordedProperties(box, "closeText");
  });

  test("changes to alreadyOpenText are recorded", () => {
    box.alreadyOpenText = "it be already open";
    expectRecordedProperties(box, "alreadyOpenText");
  });

  test("changes to alreadyClosedText are recorded", () => {
    box.alreadyClosedText = "it be already closed";
    expectRecordedProperties(box, "alreadyClosedText");
  });
});
