var registeredStore;

export const registerStore = store => {
  if (!registeredStore) {
    registeredStore = store;
    return store;
  } else {
    throw Error("Attempting to register a second store");
  }
};

export const getStore = () => {
  if (registeredStore) {
    return registeredStore;
  } else {
    throw Error("Trying to get the store, but no store has been registered");
  }
};
