[![Test](https://github.com/vir3lsa/gonorth/actions/workflows/test.yml/badge.svg)](https://github.com/vir3lsa/gonorth/actions/workflows/test.yml)

# gonorth

A JavaScript interactive fiction engine for rich parser-driven experiences on the web.

## Installation

```
npm install @vir3lsa/gonorth
```

## Documentation

Refer to [the full documentation](https://vir3lsa.github.io/gonorth/) for detailed specifications.

## Quick Start

Define where you want to embed gonorth in your HTML.

```html
<body>
  <div id="gonorth-container"></div>
</body>
```

Create a setup function. All of your game's objects should be created here.

```ts
import gn, { Room, Item, Verb } from "@virelsa/gonorth";

function setup() {
  const ride = new Verb.Builder("ride")
    .onSuccess("You swing your leg over the crossbar and start to ride. It's easy!");

  const tricycle = new Item.Builder("tricycle")
    .withDescription("A clown's wobbly tricycle.")
    .withVerb(ride);

  const bigTop = new Room.Builder("big top")
    .withDescription("A big round tent where all the circus fun happens.");
    .withItem(tricycle)
    .build();

  gn.setStartingRoom(bigTop);
}
```

Initialise the game.

```ts
gn.init({
  title: "Clowns From Space",
  elementSelector: "#gonorth-container",
  initialiser: setup
});
```
