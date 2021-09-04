import { addHintNodes, setHintNodeId } from "../../../../lib/gonorth";

const bedroomNodes = [
  {
    id: "bedroom1",
    actions: "Try looking at things differently.",
    options: {
      okay: null,
      next: "bedroom2"
    }
  },
  {
    id: "bedroom2",
    actions: "Is there something in the room that will allow you to look at things differently?",
    options: {
      okay: null,
      previous: "bedroom1",
      next: "bedroom3"
    }
  },
  {
    id: "bedroom3",
    actions: "Try looking at things in the mirror.",
    options: {
      okay: null,
      previous: "bedroom2",
      solution: "bedroom4"
    }
  },
  {
    id: "bedroom4",
    actions: "## Solution\n\nLook at the bedside table in the mirror.",
    options: {
      okay: null,
      previous: "bedroom3"
    }
  },
  {
    id: "bedroomBox",
    actions: "Is there a way of making the box on the bedside table more solid?",
    options: {
      okay: null,
      previous: "bedroom4",
      next: "bedroom6"
    }
  },
  {
    id: "bedroom6",
    actions: "How did you make the box appear? Can you repeat that process?",
    options: {
      okay: null,
      previous: "bedroomBox",
      solution: "bedroom7"
    }
  },
  {
    id: "bedroom7",
    actions: `## Solution

1. Look at the box in mirror.
1. Repeat step 1 three times.
1. Pick up the box.`,
    options: {
      okay: null,
      previous: "bedroom6"
    }
  }
];

export const initHints = (startNode) => {
  addHintNodes(...bedroomNodes);
  setHintNodeId(startNode);
};
