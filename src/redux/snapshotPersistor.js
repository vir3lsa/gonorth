/*
 * Utility class that saves snapshots of a store's state to local storage. It will also retrieve
 * snapshots on demand and dispatch the appropriate store action to apply them.
 */
export class SnapshotPersistor {
  constructor(store, loadSnapshotAction, initialState, config = {}) {
    this.store = store;
    this.loadSnapshotAction = loadSnapshotAction;
    this.initialState = initialState;
    this.config = config;
  }

  get key() {
    const modelVersion = this.config?.version;
    return modelVersion ? `gonorth:${modelVersion}` : "gonorth";
  }

  /*
   * Persist a snapshot of store state in local storage.
   */
  persistSnapshot() {
    let snapshot;
    const whitelist =
      this.config?.whitelist &&
      (Array.isArray(this.config.whitelist) ? this.config.whitelist : [this.config.whitelist]);
    const state = this.store.getState();

    if (whitelist) {
      snapshot = whitelist.reduce((acc, key) => {
        acc[key] = state[key];
        return acc;
      }, {});
    } else {
      snapshot = { ...state };
    }

    const replacer = (key, value) => {
      const serializer = this.config.serializers[key];

      if (serializer) {
        return serializer(value);
      }

      return value;
    };

    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(this.key, JSON.stringify(snapshot, replacer, 2));
      }
    } catch (error) {
      console.log("Failed to save game. Could be that storage is disabled or full.");
    }
  }

  /*
   * Retrieve a state snapshot from local storage and dispatch it to the store.
   */
  loadSnapshot() {
    const reviver = (key, value) => {
      const deserializer = this.config.deserializers[key];

      if (deserializer) {
        return deserializer(value);
      }

      return value;
    };

    if (typeof localStorage !== "undefined") {
      const snapshotString = localStorage.getItem(this.key);

      if (snapshotString) {
        const snapshot = JSON.parse(snapshotString, reviver);
        this.store.dispatch(this.loadSnapshotAction(snapshot));
      }
    }
  }

  purgeSnapshot() {
    localStorage.removeItem(this.key);
  }

  resetState() {
    /* Create an object looking like a snapshot, but comprising of initial state. Only
     * include keys from the whitelist of persisted keys. */
    const initialSnapshot = this.config.whitelist.reduce((acc, key) => {
      acc[key] = this.initialState[key];
      return acc;
    }, {});

    this.store.dispatch(this.loadSnapshotAction(initialSnapshot));
  }
}
