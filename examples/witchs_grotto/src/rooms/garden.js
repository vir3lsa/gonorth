import { Room, Npc } from "../../../../lib/gonorth";

export const garden = new Room("Garden", "placeholder");
export const witch = new Npc(
  "witch",
  "She's not how you imagined she'd look at all. Rather than being old, bony and covered in warts, she's tall, elegant, about your mother's age. Her long black hair has a single thread of grey through it, like a silvery band in a sea of darkness. Her eyes are terrifying. They're like sharp blue diamonds and gaze at you with such intensity you feel certain they're' weighing your very soul."
);
garden.addItem(witch);
