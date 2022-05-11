import { createStore, applyMiddleware } from "redux";
import gameReducer from "./reducers";
import { registerStore } from "./storeRegistry";
import thunk from "redux-thunk";
import { SnapshotPersistor } from "./snapshotPersistor";
import { selectAllItems, selectRooms } from "../utils/selectors";
import { moveItem } from "../utils/itemFunctions";
import {
  CyclicText,
  SequentialText,
  PagedText,
  RandomText,
  ManagedText,
  DeferredRandomText
} from "../game/interactions/text";

export const initStore = (name) => {
  const store = createStore(gameReducer, applyMiddleware(thunk));
  const persistor = new SnapshotPersistor(store, {
    version: 7,
    name,
    whitelist: ["turn", "itemNames", "room", "allItems", "customState"],
    serializers: {
      itemNames: (value) => [...value],
      room: (room) => room?.name.toLowerCase(),
      allItems: (items) =>
        [...items]
          .filter((item) => item._alteredProperties.size)
          .reduce((acc, item) => {
            acc[item.name] = item;
            return acc;
          }, {})
    },
    deserializers: {
      itemNames: (value) => new Set(value),
      room: (roomName) => {
        if (roomName === null) {
          // Initial state is null, so this is fine.
          return null;
        }

        const rooms = selectRooms();
        const room = rooms[roomName];
        if (!room) {
          console.error(`Attempted to load room with name "${roomName}" but no such room exists.`);
        }
        return room;
      },
      allItems: (snapshotAllItems) => {
        const stateAllItems = [...selectAllItems()];
        // Augment the complete list of all items with values from the snapshot.
        Object.entries(snapshotAllItems).forEach(([name, snapshotItem]) => {
          // Get the full item from the store.
          const itemToUpdate = stateAllItems.find((item) => item.name === name);
          Object.entries(snapshotItem).forEach(([property, value]) => {
            if (value?.isItem) {
              // The value's a pointer to an Item, so get the full item from the store's list.
              const actualItem = stateAllItems.find((item) => item.name === value.name);

              if (property === "container") {
                moveItem(itemToUpdate, actualItem);
              } else {
                itemToUpdate[property] = actualItem;
              }

              if (!itemToUpdate[property]) {
                console.error(
                  `Tried to deserialize "${name}", which has a ${property} called ${value.name}, but no such item could be found.`
                );
              }
            } else if (value?.isText) {
              // The value represents a Text we either need to recreate entirely or just update.
              if (value.partial) {
                // We simply need to update the existing Text
                const textToUpdate = itemToUpdate[property];
                Object.entries(value)
                  .filter(([textProperty]) => textProperty !== "isText")
                  .forEach(([textProperty, textValue]) => (textToUpdate[textProperty] = textValue));
              } else {
                // We need to reconstruct the Text from scratch.
                const reconstructText = (serializedText) => {
                  let newText;

                  switch (serializedText.type) {
                    case "CyclicText":
                      newText = new CyclicText(...serializedText.texts);
                      break;
                    case "SequentialText":
                      newText = new SequentialText(...serializedText.texts);
                      break;
                    case "PagedText":
                      newText = new PagedText(...serializedText.texts);
                      break;
                    case "RandomText":
                      newText = new RandomText(...serializedText.texts);
                      break;
                    case "DeferredRandomText":
                      newText = new DeferredRandomText(...serializedText.texts);
                      break;
                    case "ManagedText":
                      newText = serializedText.phases
                        .reduce(
                          (builder, phase) => builder.withText(reconstructText(phase.text)).times(phase.times),
                          new ManagedText.Builder()
                        )
                        .build();
                      break;
                  }

                  // Now we need to set the remaining changed properties that couldn't be set via the constructor.
                  Object.entries(value)
                    .filter(
                      ([textProperty]) =>
                        textProperty !== "texts" && textProperty !== "phases" && textProperty !== "type"
                    )
                    .forEach(([textProperty, textValue]) => (newText[textProperty] = textValue));

                  return newText;
                };

                // Finally, set the new Text on the appropriate field of the item.
                itemToUpdate[property] = reconstructText(value);
              }
            } else {
              itemToUpdate[property] = value;
            }
          });
        });

        return stateAllItems;
      }
    }
  });

  registerStore(store, persistor);
};
