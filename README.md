![Node CI](https://github.com/vir3lsa/gonorth/workflows/Node%20CI/badge.svg)

# gonorth

A JavaScript interactive fiction engine for rich parser-driven experiences on the web.

## Installation

```
npm install @vir3lsa/gonorth
```

## Quick Start

Define where you want to embed gonorth in your HTML.

```html
<body>
  <div id="gonorth-container"></div>
</body>
```

Create a setup function. All of your game's objects should be created here.

```ts
import gn from "@virelsa/gonorth";

function setup() {
  const bigTop = new Room.Builder("big top)
    .withDescription("A big round tent where all the circus fun happens.");
    .withItem(
      new Item.Builder("tricycle")
        .withDescription("A clown's wobbly tricycle.)
        .withVerb(
          new Verb.Builder("ride")
            .withOnSuccess("You swing your leg over the crossbar and start to ride. It's easy!")
        )
    )
    .build();

  gn.setStartingRoom(bigTop);
}
```

Initialise the game.

```ts
import gn from "@virelsa/gonorth";

initGame(
  "Clowns From Space",
  "Virelsa",
  {
    storeName: "space-clowns",
    referToPlayerAs: "Toby",
    startScreenImage: clownsTitlesPng
  },
  setup
);

if (typeof document !== "undefined") {
  let container = document.querySelector("#gonorth-container");
  gn.attach(container);
}

gn.play();
```