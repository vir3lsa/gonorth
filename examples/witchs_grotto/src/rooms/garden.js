import { Room, Npc } from "../../../../lib/gonorth";

let garden, witch;

export const getWitch = () => {
  return witch;
};

export const initWitch = () => {
  witch = new Npc(
    "witch",
    "She's not how you imagined she'd look at all. Rather than being old, bony and covered in warts, she's tall, elegant, about your mother's age. Her long black hair has a single thread of grey through it, like a silvery band in a sea of darkness. Her eyes are terrifying. They're like sharp blue diamonds and gaze at you with such intensity you feel certain they're' weighing your very soul."
  );
};

export const getGarden = () => {
  return garden;
};

export const initGarden = () => {
  garden = new Room("Garden", "placeholder");
  garden.addItem(getWitch());
  return garden;
};

