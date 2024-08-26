import { AnyAction } from "redux";
import { Interaction, Verb, initGame } from "../../gonorth";
import { changeInteraction, newGame } from "../../redux/gameActions";
import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { Npc } from "./npc";
import { Item } from "./item";
import { selectCurrentPage } from "../../utils/testSelectors";

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let game;

beforeEach(() => {
  unregisterStore();
  game = initGame("Chopin Underground", "", { debugMode: false });
  getStore().dispatch(newGame(game, false));
  getStore().dispatch(changeInteraction(new Interaction("")) as AnyAction);
});

describe("NPC tests", () => {
  test("NPCs can be constructed", () => {
    const npc = new Npc.Builder("Jane").withDescription("Ambitious").build();
    expect(npc.name).toBe("Jane");
    expect(npc.description).toBe("Ambitious");
  });

  test("NPCs can be given aliases and verbs", async () => {
    const npc = new Npc.Builder("cleaner")
      .withDescription("Burly")
      .withVerb(new Verb.Builder("clean").withOnSuccess("John cleans"))
      .build();
    await npc.try("clean");
    expect(selectCurrentPage()).toInclude("John cleans");
  });

  test("NPCs can be given aliases and they don't override aliases derived from the name", () => {
    const npc = new Npc.Builder("Mister Headphone").withAliases("pair of headphones").build();
    expect(npc.aliases).toContain("mister");
    expect(npc.aliases).toContain("headphone");
    expect(npc.aliases).toContain("pair of headphones");
    expect(npc.aliases).toContain("pair");
  });

  test("NPC verbs can be customised", async () => {
    const npc = new Npc.Builder("moppo")
      .isHoldable()
      .customiseVerb("take", (take) => take.onSuccess.addAction("You immediately mop"))
      .build();
    await npc.try("take");
    expect(selectCurrentPage()).toInclude("You immediately mop");
  });

  test("NPC aliases can be omitted", () => {
    const npc = new Npc.Builder("Prof Cloud").omitAliases("prof").build();
    expect(npc.aliases).toEqual(["cloud"]);
  });

  test("Non-hidden items may be added via the builder", () => {
    const nurse = new Npc.Builder("nurse")
      .hasItem(new Item.Builder("bride"))
      .hasItem(new Item.Builder("groom"))
      .hasItems(new Item.Builder("icing"), new Item.Builder("ribbon"))
      .build();
    expect(nurse.items.bride).toBeDefined();
    expect(nurse.items.groom).toBeDefined();
    expect(nurse.items.icing).toBeDefined();
    expect(nurse.items.ribbon).toBeDefined();
  });
});
