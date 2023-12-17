import { OptionGraph } from "../game/interactions/optionGraph";
import { getKeywords } from "../game/verbs/keywords";
import { clearPage } from "./lifecycle";
import { selectGame, selectRoom } from "./selectors";

export const getKeywordsTable = () => {
  let keywordsTable = `Keyword     | Aliases    | Description
:-----------|:-----------|:---------------------`;
  const keywords = Object.values(getKeywords()).filter((k) => !k.doNotList);
  const uniqueKeywords = [...new Set(keywords)];
  uniqueKeywords.forEach((k) => (keywordsTable += `\n${k.name} | ${k.aliases.join(", ")} | ${k.description || ""}`));
  return keywordsTable;
};

const optionNodes = [
  {
    id: "help",
    actions: [
      () => clearPage(),
      () =>
        `The game you're playing, ${
          selectGame().title
        }, is a work of interactive fiction, meaning that for much of the game you will be presented with a text box asking "What do you want to do?" You should answer that question by typing commands into the box and pressing \`Enter\`. The game will do its best to interpret what you typed and act accordingly.`
    ],
    options: {
      next: "help2",
      "cancel help": "haveFun"
    }
  },
  {
    id: "help2",
    actions: `Commands are usually of the form "\`verb\` \`noun\`" e.g. "pick up ball" or "open door". The game is fairly forgiving of extra words around the verb and noun (or item name) so you could write those commands as "now you should pick up that little ball from the floor" or "I want you to open that really obvious door in front of you" and they'll work exactly as before.`,
    options: {
      next: "help3",
      previous: "help",
      "cancel help": "haveFun"
    }
  },
  {
    id: "help3",
    actions: `Both verbs and nouns can be made up of multiple words. We've already seen "pick up" as an example of a multi-word verb; noun examples include "steel paring knife" or "red fire engine".`,
    options: {
      next: "help4",
      previous: "help2",
      "cancel help": "haveFun"
    }
  },
  {
    id: "help4",
    actions: `That brings us nicely onto disambiguation. If you're not specific enough with your command, you may be asked to clarify. For example, if there's both a red and a blue ball in the room, typing "pick up ball" will prompt the following question, allowing you to pick between objects that matched the command:\n\nWhich ball do you mean?`,
    options: {
      "red ball": "verbsAndAliases",
      "blue ball": "verbsAndAliases",
      "cancel help": "haveFun"
    }
  },
  {
    id: "verbsAndAliases",
    actions: `Verbs are "doing words" and are a central mechanism of this game, allowing you to interact with the world in varied and interesting ways. No comprehensive list of available verbs will be given - you'll have to figure that out on your own. Experiment! There's no harm in typing a command the game doesn't recognise - it'll indicate this and you can try something else.`,
    options: {
      next: "verbsAndAliases2",
      previous: "help3",
      "cancel help": "haveFun"
    }
  },
  {
    id: "verbsAndAliases2",
    actions: `Some verbs will require that you specify more than one noun to interact with. For example, if you say "put the ball on the table", you're giving two nouns to the verb \`put\`, i.e. \`ball\` and \`table\`. You could be asked to disambiguate either of these nouns if more than one matches what you typed.`,
    options: {
      next: "verbsAndAliases3",
      previous: "verbsAndAliases",
      "cancel help": "haveFun"
    }
  },
  {
    id: "verbsAndAliases3",
    actions: `Both verbs and nouns can have various synonyms that the game understands, meaning they can be referred to in a number of different ways. For example, the verb "examine", which is your primary means of investigating the game's world, can also be invoked with "look at", "inspect" or even, since it's such a common command "x". Many items with long names will also be understood using shorter or abbreviated versions e.g. "paring knife" could be referred to as either "paring" or "knife" (though you may be asked to clarify if there are multiple knives).`,
    options: {
      next: "keywords",
      previous: "verbsAndAliases2",
      "cancel help": "haveFun"
    }
  },
  {
    id: "keywords",
    actions: () =>
      `The game understands several keywords. Below is a list of these and some of their aliases:\n\n${getKeywordsTable()}\n\nThis is not a complete list - there are more for you to discover.`,
    options: {
      next: "hints",
      previous: "verbsAndAliases3",
      "cancel help": "haveFun"
    }
  },
  {
    id: "hints",
    actions: () =>
      `The aim of the game is to experiment, think logically and explore. If you find that you're stuck I recommend that you consider what your current objective is, what's standing in the way of you achieving it, and logically how that obstacle might be removed. If you've tried everything you can think of and you're still stuck you can get a hint with the "hint" keyword. This will also eventually give you the solution if you really want it, but I urge you to try to find it yourself. It'll be far more satisfying that way.`,
    options: {
      okay: "haveFun",
      previous: "keywords"
    }
  },
  {
    id: "haveFun",
    actions: [
      `To view these help pages again, type "help".\n\nGood luck, and have fun.`,
      () => selectRoom().verbs.examine.attempt(selectRoom())
    ]
  }
];

let helpGraph: OptionGraphT, hintGraph: OptionGraphT;

export const getHelpGraph = () => {
  if (!helpGraph) {
    helpGraph = new OptionGraph("defaultHelp", ...optionNodes);
  }

  return helpGraph;
};

export const getHintGraph = () => {
  if (!hintGraph) {
    hintGraph = new OptionGraph(
      "hints",
      {
        id: "default",
        actions: "I'm afraid you're on your own on this one. I can't help you.",
        options: {
          okay: null,
          more: "default2"
        }
      },
      {
        id: "default2",
        actions: "No, I'm afraid I really don't know anything. You'll just have to use the old noggin.",
        options: {
          okay: null,
          previous: "default"
        }
      }
    );
  }

  return hintGraph;
};
