import { OptionGraph, getKeywords, SequentialText } from "@gonorth";

export const getKeywordsTable = () => {
  let keywordsTable = `Keyword     | Aliases    | Description
:-----------|:-----------|:---------------------`;
  const keywords = Object.values(getKeywords()).filter((k) => !k.doNotList);
  keywords.forEach((k) => (keywordsTable += `\n${k.name} | ${k.aliases.join(", ")} | ${k.description || ""}`));
  return keywordsTable;
};

const optionNodes = [
  {
    id: "basics",
    actions: () =>
      new SequentialText(
        `Let's go over the basics, applicant. The goal in each of these trials is to reach my sigil, which will be emblazoned on one of the grid tiles. Additional rules will be added as you progress, but you'll be informed of these at the appropriate time.`,
        `You'll be permitted the use of two spells for the duration of trials. Cast "dextrum" to anchor the white aspect of a bridge, and "sinistrum" to anchor the black. The two aspects form the two ends of a bridge - called a "wormhole" in some worlds. You and other objects may pass freely through the bridge without fear of harm. Assuming you cast the spells correctly, of course.`,
        `When you cast one of the two bridge spells, the anchor will be emitted from your hand and will travel until it meets a surface. Stone is a suitable medium for the existence of anchors - other materials will not support them, so don't try.`,
        `Whilst you will remain facing north throughout the trial, you can cast spells directionally. For instance, "sinistrum east" will cast the black bridge anchor accordingly.`,
        `Each trial is divided into Cartesian grid coordinates. When you move, you will move by one grid space at a time. You may inspect the contents of any grid space with the command "grid x y". For instance, "grid 1 8" in the first trial would reveal the existence of my sigil.`,
        `I will now offer some more general advice about interacting with the world. You may find it useful. If not, feel free to say so and we will return to the trials.`
      ),
    options: {
      continue: "help",
      "enough!": "haveFun"
    }
  },
  {
    id: "help",
    actions: () =>
      `These trials are a work of interactive fiction, meaning that much of the time you will be presented with a text box asking "What do you want to do?" You should answer that question by typing commands into the box and pressing \`Enter\`. I will do my best to interpret what you typed and act accordingly.`,
    options: {
      continue: "help2",
      "enough!": "haveFun"
    }
  },
  {
    id: "help2",
    actions: `Commands are usually of the form "\`verb\` \`object\`" e.g. "pick up ball" or "open door". I am fairly forgiving of extra words around the verb and object so you could write those commands as "now you should pick up that little ball from the floor" or "I want you to open that really obvious door in front of you" and they'll work exactly as before.`,
    options: {
      continue: "help3",
      previous: "help",
      "enough!": "haveFun"
    }
  },
  {
    id: "help3",
    actions: `Both verbs and objects can be made up of multiple words. We've already seen "pick up" as an example of a multi-word verb; object examples include "steel paring knife" or "red fire engine".`,
    options: {
      continue: "help4",
      previous: "help2",
      "enough!": "haveFun"
    }
  },
  {
    id: "help4",
    actions: `That brings us nicely onto disambiguation. If you're not specific enough with your command, you may be asked to clarify. For example, if there's both a red and a blue ball in the room, typing "pick up ball" will prompt the following question, allowing you to pick between objects that matched the command:\n\nWhich ball do you mean?`,
    options: {
      "red ball": "verbsAndAliases",
      "blue ball": "verbsAndAliases",
      "enough!": "haveFun"
    }
  },
  {
    id: "verbsAndAliases",
    actions: `Verbs are "doing words" and are a central mechanism of the trials, allowing you to interact with the world in varied and interesting ways. No comprehensive list of available verbs will be given - you'll have to figure that out on your own. Experiment! There's no harm in typing a command I don't recognise - I'll indicate this and you can try something else.`,
    options: {
      continue: "verbsAndAliases2",
      previous: "help3",
      "enough!": "haveFun"
    }
  },
  {
    id: "verbsAndAliases2",
    actions: `Some verbs will require that you specify more than one object. For example, if you say "put the ball on the table", you're giving two objects to the verb \`put\`, i.e. \`ball\` and \`table\`. You could be asked to disambiguate either of these objects if more than one matches what you typed.`,
    options: {
      continue: "verbsAndAliases3",
      previous: "verbsAndAliases",
      "enough!": "haveFun"
    }
  },
  {
    id: "verbsAndAliases3",
    actions: `Both verbs and objects can have various aliases, meaning they can be referred to in a number of different ways. For example, the verb "examine", which is your primary means of investigating the world, can also be invoked with "look at", "inspect" or even, since it's such a common command "x". Many objects with long names will also be understood using shorter or abbreviated versions e.g. "paring knife" could be referred to as either "paring" or "knife" (though you may be asked to clarify if there are multiple knives).`,
    options: {
      continue: "keywords",
      previous: "verbsAndAliases2",
      "enough!": "haveFun"
    }
  },
  {
    id: "keywords",
    actions: () =>
      `I understand several keywords. Below is a list of these and some of their aliases:\n\n${getKeywordsTable()}\n\nThis is not a complete list - there are more for you to discover.`,
    options: {
      continue: "hints",
      previous: "verbsAndAliases3",
      "enough!": "haveFun"
    }
  },
  {
    id: "hints",
    actions: () =>
      `Each trial is a self-contained puzzle that can be solved using only the items in the current tableu and any spells you have access to. If you've tried everything you can think of and you're still stuck you can get a hint with the "hint" keyword. This will also eventually give you the solution if you really want it, but I urge you to try to find it yourself. It'll be far more satisfying that way.`,
    options: {
      okay: "haveFun",
      previous: "keywords"
    }
  },
  {
    id: "haveFun",
    actions: `To hear these instructions again, type "help".\n\nGood luck, and have fun.`
  }
];

export const helpGraph = new OptionGraph("help", ...optionNodes);
