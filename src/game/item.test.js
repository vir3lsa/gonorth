import Item from "./item";
import { initStore } from "../redux/store";
import { getStore } from "../redux/storeRegistry";
import { SequentialText } from "./text";
import { newGame } from "../redux/gameActions";
initStore();

// Pretend we're in the browser
getStore().dispatch(newGame(null, true, false));

const selectOptions = () => getStore().getState().game.interaction.options;

test("items can have variable descriptions", () => {
  let looks = 0;
  const clock = new Item("clock", item => {
    looks++;
    if (looks === 1) {
      return "It's 12 o'clock";
    } else if (looks === 2) {
      return "It's 1 o'clock";
    }
  });

  expect(clock.description).toBe("It's 12 o'clock");
  expect(clock.description).toBe("It's 1 o'clock");
});

it("Doesn't render a Next button for cyclic descriptions", () => {
  const table = new Item("table", ["It's made of wood.", "It has four legs."]);
  table.try("x");
  expect(selectOptions()).toBeNull();
});

it("renders each page of sequential text then stops", async () => {
  const chair = new Item("chair", new SequentialText("a", "b"));
  chair.try("x");
  setTimeout(() => selectOptions()[0].action());
  expect(selectOptions()).toBeNull();
});
