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

gn.init({
  title: "Clowns From Space",
  elementSelector: "#gonorth-container",
  initialiser: setup
});
```