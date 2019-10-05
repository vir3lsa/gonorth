import Item from "./item";

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
