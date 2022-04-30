import { createStore, applyMiddleware } from "redux";
import gameReducer from "./reducers";
import { registerStore } from "./storeRegistry";
import thunk from "redux-thunk";
import { SnapshotPersistor } from "./snapshotPersistor";
import { loadSnapshot, setPlayer } from "./gameActions";
import { selectAllItems, selectRooms } from "../utils/selectors";
import { initialState } from "./reducers/gameReducer";
import { Item } from "../game/items/item";

export const initStore = (name) => {
  const store = createStore(gameReducer, applyMiddleware(thunk));
  const persistor = new SnapshotPersistor(store, loadSnapshot, initialState, {
    version: 6,
    name, // TODO This doesn't work yet as there's no way of passing a name in.
    whitelist: ["turn", "itemNames", "room", "allItems"],
    serializers: {
      itemNames: (value) => [...value],
      room: (room) => room.name.toLowerCase(),
      allItems: (items) =>
        [...items]
          .filter((item) => item._alteredProperties.size)
          .reduce((acc, item) => {
            const serializableItem = [...item._alteredProperties]
              .map((propertyName) => {
                const propertyValue = item[propertyName];

                if (typeof propertyValue === "function") {
                  throw Error(
                    `Attempted to serialize property ${propertyName} of "${item.name}" when saving game, but the property is a function. Changing properties to functions at runtime is not supported as functions can't be serialized.`
                  );
                } else if (propertyValue instanceof Item) {
                  return [propertyName, { name: propertyValue.name, isItem: true }];
                } else if (Array.isArray(propertyValue)) {
                  const sanitisedArray = propertyValue.map((entry) =>
                    entry instanceof Item ? { name: entry.name, isItem: true } : entry
                  );
                  return [propertyName, sanitisedArray];
                }

                return [propertyName, propertyValue];
              })
              .reduce((acc, [propertyName, propertyValue]) => {
                acc[propertyName] = propertyValue;
                return acc;
              }, {});

            serializableItem.itemType = item._type;
            acc[item.name] = serializableItem;
            return acc;
          }, {})
    },
    deserializers: {
      itemNames: (value) => new Set(value),
      room: (roomName) => {
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
              itemToUpdate[property] = stateAllItems.find((item) => item.name === value.name);

              if (!itemToUpdate[property]) {
                console.error(
                  `Tried to deserialize "${name}", which has a ${property} called ${value.name}, but no such item could be found.`
                );
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

  // Create the player after registering the store as Items need to inspect an existing store.
  store.dispatch(setPlayer(new Item("player", "You look as you normally do.", false)));
};
