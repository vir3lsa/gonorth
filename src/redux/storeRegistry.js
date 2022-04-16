var registeredStore, registeredPersistor;

export const registerStore = (store, persistor) => {
  if (!registeredStore) {
    registeredStore = store;
    registeredPersistor = persistor;
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

export const getPersistor = () => {
  if (registeredPersistor) {
    return registeredPersistor;
  } else {
    throw Error("Trying to get the persistor, but no persistor has been registered");
  }
};

export const unregisterStore = () => {
  registeredStore = null;
  registeredPersistor = null;
};
