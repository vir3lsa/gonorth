import { createStore, applyMiddleware } from "redux";
import gameReducer from "./reducers";
import { registerStore } from "./storeRegistry";
import thunk from "redux-thunk";
import { SnapshotPersistor } from "./snapshotPersistor";
import { selectAllItems, selectOptionGraphs, selectRooms } from "../utils/selectors";
import { moveItem } from "../utils/itemFunctions";
import {
  CyclicText,
  SequentialText,
  PagedText,
  RandomText,
  ManagedText,
  DeferredRandomText,
  Text,
  ManagedTextBuilder
} from "../game/interactions/text";
import type { Room } from "../game/items/room";
import type { Item } from "../game/items/item";

const isSerializedItem = (arg?: Serialized): arg is SerializedItem => {
  return Boolean(arg?.hasOwnProperty("isItem"));
};

const isSerializedText = (arg?: Serialized): arg is SerializedText => {
  return Boolean(arg?.hasOwnProperty("isText"));
};

export const initStore = (name?: string) => {
  const store = createStore(gameReducer, applyMiddleware(thunk));
  const persistor = new SnapshotPersistor(store, {
    version: 8,
    name,
    whitelist: ["turn", "itemNames", "room", "allItems", "customState", "optionGraphs"],
    serializers: {
      itemNames: (value: Set<string>) => [...value],
      room: (room: Room) => room?.name.toLowerCase(),
      allItems: (items: Item[]) =>
        [...items]
          .filter((item) => item.alteredProperties.size)
          .reduce((acc, item) => {
            acc[item.name] = item;
            return acc;
          }, {} as AllItemsDict),
      optionGraphs: (optionGraphs: OptionGraphDict) =>
        Object.entries(optionGraphs).reduce((acc, [id, optionGraph]) => {
          acc[id] = { currentNode: optionGraph.currentNode?.id };
          return acc;
        }, {} as SerializableOptionGraphDict)
    },
    deserializers: {
      itemNames: (value) => new Set(value as string[]),
      room: (roomName) => {
        if (roomName === null) {
          // Initial state is null, so this is fine.
          return null;
        }

        const rooms = selectRooms();
        const room = rooms[roomName as string];
        if (!room) {
          console.error(`Attempted to load room with name "${roomName}" but no such room exists.`);
        }
        return room;
      },
      allItems: (snapshotAllItems) => {
        const stateAllItems = [...selectAllItems()];
        // Augment the complete list of all items with values from the snapshot.
        Object.entries(snapshotAllItems as SerializedItemsDict).forEach(([name, snapshotItem]) => {
          // Get the full item from the store.
          const itemToUpdate = stateAllItems.find((item) => item.name === name);

          if (!itemToUpdate) {
            throw Error("Saved game corrupted or outdated - please start a new game.");
          }

          Object.entries(snapshotItem).forEach(([property, value]) => {
            if (isSerializedItem(value)) {
              // The value's a pointer to an Item, so get the full item from the store's list.
              const actualItem = stateAllItems.find((item) => item.name === value.name);

              if (!actualItem) {
                throw Error("Saved game corrupted or outdated - please start a new game.");
              }

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
            } else if (isSerializedText(value)) {
              // The value represents a Text we either need to recreate entirely or just update.
              if (value.partial) {
                // We simply need to update the existing Text
                const textToUpdate = itemToUpdate[property] as Text;
                Object.entries(value)
                  .filter(([textProperty]) => textProperty !== "isText")
                  .forEach(([textProperty, textValue]) => (textToUpdate[textProperty] = textValue));
              } else {
                // We need to reconstruct the Text from scratch.
                const reconstructText = (serializedText: SerializedText) => {
                  let newText: Text | ManagedText;

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
                      newText = serializedText
                        .phases!.reduce(
                          (builder, phase): ManagedTextBuilder =>
                            builder.withText(reconstructText(phase.text) as Text).times(phase.times),
                          new ManagedText.Builder()
                        )
                        .build();
                      break;
                    default:
                      throw Error("Tried to deserialize a Text with no type property.");
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
                itemToUpdate[property] = reconstructText(value as SerializedText);
              }
            } else {
              itemToUpdate[property] = value;
            }
          });
        });

        return stateAllItems;
      },
      optionGraphs: (snapshotOptionGraphs) => {
        const stateOptionGraphs = { ...selectOptionGraphs() };
        Object.entries(snapshotOptionGraphs).forEach(([id, snapshotOptionGraph]) => {
          if (snapshotOptionGraph.currentNode) {
            const optionGraph = stateOptionGraphs[id];
            optionGraph.currentNode = optionGraph.getNode(snapshotOptionGraph.currentNode);
          }
        });

        return stateOptionGraphs;
      }
    }
  });

  registerStore(store, persistor);
};
