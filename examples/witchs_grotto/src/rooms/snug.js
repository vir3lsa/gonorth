import {
  Room,
  Npc,
  Verb,
  selectPlayer,
  OptionGraph,
  RandomText,
  SequentialText
} from "../../../../lib/gonorth";
import { Potion } from "../magic/alchemy";
import { bookShelf, druidicPeoples } from "./apothecary/bookshelf";

export const snug = new Room(
  "Snug",
  "You find yourself in a cozy snug or cubby. The embers of a fire still glow in a small fireplace and give off a gentle warmth. There's a single large armchair with a black cat curled up in it just in front of the stone hearth. Various leather-bound books are scattered around the room or lie in small piles. There are thick cobwebs in the corners of the room, testament to the witch's aversion to housework.\n\nThe only way out is via the moon and stars bead curtain to the East."
);

const cat = new Npc(
  "Mr Snugglesworth",
  "The cat's fur is inky black, like a moonless sky. It's curled up in the richly-upholstered armchair and appears to be soundly asleep, but as you approach it slyly peers at you throught slitted eyelids. The eyes gleam like opalescent fire, a keen intelligence lurking behind them."
);
cat.aliases = ["cat"];

let catName = "Sir";
const catTalkNodes = [
  {
    id: "greeting",
    actions: new SequentialText(
      `Nervously wringing your hands, you politely address the cat.\n\n"Umm, excuse me little cat. I hope you-"`,
      `Before you can get any further the cat cuts you off mid-sentence.\n\n"Odin's whiskers, it speaks! Wonder of wonders, can it wash itself too?"`
    ),
    options: {
      "Of course": "ofCourseCanWash",
      "I'm Genevieve": "introduce",
      Leave: "leave"
    }
  },
  {
    id: "ofCourseCanWash",
    actions: new SequentialText(
      `"Of course I know how to wash myself!" You cry indignantly. "Mother makes me wash in the stream twice a week!"`,
      `"Sarcasm isn't lost on you, I see," replies the cat, rolling its eyes. "Never mind. How is it you believe I can be of assistance to you?"`
    ),
    options: {
      "Don't understand": "dontUnderstand",
      "I'm Genevieve": "introduce",
      Leave: "leave"
    }
  },
  {
    id: "dontUnderstand",
    actions: new SequentialText(
      `"I don't know what that means," you reply, sorrowfully. "Sar-chasm?"`,
      `"No matter, no matter," says the cat. "I'll try to restrain myself from dazzling you with verbiage from now on. Now, what do we call you?"`
    ),
    options: {
      "I'm Genevieve": "introduce",
      Leave: "leave"
    }
  },
  {
    id: "introduce",
    actions: new SequentialText(
      `"Umm. My name's Genevieve. I think the lady that lives here wants to eat me and I really must get home. Can you help me, pussycat?"`,
      `The cat regards you for a moment, seemingly wrestling with indecision, before replying, "Well, Genevieve, that's quite the predicament, isn't it? Quite the predicament indeed. Yes, our dear Mildred is prey to certain...predilictions. Quite unbecoming, truth be told, but we're all slaves to our vices, aren't we?"`,
      `The cat pauses, as if expecting a response. When none is forthcoming, it continues, "What am I saying? You're much too young to know what I'm talking about. Anyway, about your getting home. Locked the door, has she? Yes, she will do that, the mean old bat. Not sporting at all, that."`
    ),
    options: {
      "Your name": "yourName",
      "Find key": "findKey",
      "How to escape": "escape",
      "Need fur": "needFur",
      Leave: "leave"
    }
  },
  {
    id: "yourName",
    actions: new SequentialText(
      `Before the cat can continue, you interject, "And what's your name, kitty, if you don't mind me asking?"`,
      `"My name?" The cat clears its throat and its eyes dart around, as though embarrassed. "It's Mister...Cat. That'll have to do."`
    ),
    options: {
      "Mister Cat it is": "misterCat",
      "No, really": "noReally",
      Leave: "leave"
    }
  },
  {
    id: "misterCat",
    actions: [
      () => {
        catName = "Mister Cat";
        return null;
      },
      () =>
        `"Nice to meet you, ${catName}."\n\nThe cat appears to wince, then nods for you to go on.`
    ],
    options: {
      "Find key": "findKey",
      "How to escape": "escape",
      "Need fur": "needFur",
      Leave: "leave"
    }
  },
  {
    id: "noReally",
    actions: [
      () => {
        catName = "Mister Snugglesworth";
        return null;
      },
      new SequentialText(
        `"You're not fooling me, *Mister Cat*," you say with a smirk. "What's your *real* name?"`,
        `The cat sighs audibly. "Very well," it says with an air of resignation. "Mister Snugglesworth, at your service."`
      )
    ],
    options: {
      Giggle: "giggle",
      "Find key": "findKey",
      "How to escape": "escape",
      "Need fur": "needFur",
      Leave: "leave"
    }
  },
  {
    id: "giggle",
    actions: () =>
      new SequentialText(
        `Unable to help yourself, you let out a short, delighted peel of laughter before stifling it with a hurried hand over your mouth.`,
        `"Oh, so you find my moniker amusing, do you, *Jenner Veev*? What if I told you yours sounds like something from a bad periodical?"`,
        `"Sorry!" you rescue. "It's really a very lovely name, sir."`,
        `${catName} eyes you suspiciously. "Yes. Well. Where were we?"`
      ),
    options: {
      "Find key": "findKey",
      "How to escape": "escape",
      "Need fur": "needFur",
      Leave: "leave"
    }
  },
  {
    id: "findKey",
    actions: () =>
      new SequentialText(
        `Do you know where...Mildred...keeps the key, ${catName}?`,
        `${catName} shakes his head emphatically, his white whiskers swishing back and forth. "You can forget that idea straight away, Jenner. She keeps the key on her all the time and there's no way you'd be able to snatch it, I'm afraid to say. Use that oversized two-legger brain of yours to find another solution."`
      ),
    options: {
      "How to escape": "escape",
      "Need fur": "needFur",
      Leave: "leave"
    }
  },
  {
    id: "escape",
    actions: [
      () => bookShelf.hidesItems.push(druidicPeoples),
      () =>
        new SequentialText(
          `"Like I said, ${catName}, I really need to get home. Mother will give me a scalding already and if I get much later..." You make your eyes big and round. "You must know how to get out of here. Please - help me."`,
          `"Hmm, yes, well." He appears to think for a moment, his eyes narrowing to aquamarine slits. "There *might* be a way. But...hmm."`,
          `"Would you fetch me a book from the library in the apothecary? My memory's not what it was and I wouldn't wish to lead you astray. You'll see it at once. It's bound in green leather and it's called 'Druidic Peoples and Their Customs'. Ah, but it's written in Felinese. You speak it...but do you read it?"`
        )
    ],
    options: {
      "Feli-what?": "felinese",
      Okay: "willFind",
      "Need fur": "needFur"
    }
  },
  {
    id: "felinese",
    actions: new SequentialText(
      `"I speak...what?"`,
      `The cat looks genuinely incredulous. "Felinese, dear girl! The only language of truly civilised creatures, a high bar for linguistic expressivity and a hallmark for *culture*." He practically coughs the last word out. "The language we're conversing in at this very moment!"`,
      `"I thought you were speaking English!" you gasp, taken aback.`,
      `"Inglish! Inglish she says. Pah! Perish the thought, girl. I'd sooner take a dip in the nearest pond than soil my mouth with that revolting two-legger claptrap."`
    ),
    options: {
      "Take offence": "takeOffence",
      Okay: "willFind",
      "Need fur": "needFur"
    }
  },
  {
    id: "takeOffence",
    actions: `On seeing your hurt expression the cat says, "Oh, come now, girl, I didn't mean... I have a terrible habit of running my mouth off and getting myself into trouble. Cheer up - you're one of us now! You're *talking*. No need for tears, eh?"`,
    options: {
      Okay: "willFind"
    }
  },
  {
    id: "willFind",
    actions: () =>
      new SequentialText(
        `"Okay, ${catName}," you say, uncertainly. "I'll see if I can find the book."`,
        `"That's the spirit! There's the vivacity little girls are famed for! Come back to me when you've found it and we'll see what we can do about your...situation." He attempts a smile but only succeeds in baring his fangs.`
      )
  },
  {
    id: "spokeBefore",
    actions: new SequentialText(
      `"I spoke to you before and you ignored me!" you protest.`,
      `The cat snorts. "That, my dear girl, was not speaking. That was inane two-legger babble at its most nonsensical. I'd assumed there was no hope at all for you, I must admit, but here we are, conversing for all the world like two civilised creatures. Who'd have thought you had it in you all along, eh? So no more of that absurd furless drivel, please."`
    ),
    options: {
      "I'm Genevieve": "introduce",
      Leave: "leave"
    }
  },
  {
    id: "needFur",
    actions: () =>
      new SequentialText(
        `"Please, ${catName}, could I have some of your fur?" you ask in your meekest voice.`,
        `The cat tilts its head back and guffaws. "Don't be daft, Jenner! You're not a cat. How could you hope to grow fur like mine?"`,
        `You stare at him meaningfully. He continues laughing but, on seeing your expression, abruptly stops.`,
        `"Oh," he says. "Oh no."`,
        `"Please!" you counter, elongating the vowel.`,
        `"Tell you what. Mildred has a bag of cat treats. Most delicious stuff I've ever tasted - Lord knows where she got it. Keeps it somewhere in her bedroom, I'm sure. Help an old mog out and fetch it for me, would you? Only I can't manage the stairs, you see. Bring me the treats and you can have some fur."`
      )
  },
  {
    id: "leave",
    actions: new RandomText(
      `"Sorry, sir. I've got to go."`,
      `"I just remembered I have to do something!"`,
      `"I'll be back later. Bye!"`
    ),
    noEndTurn: true
  }
];

const catGraph = new OptionGraph(...catTalkNodes);

const speak = new Verb(
  "speak",
  () => selectPlayer().dolittle,
  () => catGraph.commence(),
  [
    () => {
      catGraph.getNode("greeting").options["Spoke to you before"] =
        "spokeBefore";
      return null;
    },
    new SequentialText(
      `Clearing your throat, you politely address the cat.\n\n"Hello, Mr Pussycat, sir. Err... or Madam. I'm Genevieve."`,
      `The cat regards you for a long while. You'd swear it had an eyebrow raised if not for the fact it doesn't have eyebrows. Then it lets out a single weary meaow, before closing its eyes and resting its chin back on its front paws. You feel as though you've been dismissed.`
    )
  ],
  ["talk", "question", "ask", "tell"]
);

cat.addVerb(speak);

// TESTING (remove)
const dolittle = new Potion("Dolittle Decoction");
// TESTING (end)

snug.addItems(cat, dolittle);
