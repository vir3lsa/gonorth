/*
 * Utility class that saves snapshots of a store's state to local storage. It will also retrieve
 * snapshots on demand and dispatch the appropriate store action to apply them.
 */
export class SnapshotPersistor {
  constructor(store, loadSnapshotAction, config = {}) {
    this.store = store;
    this.loadSnapshotAction = loadSnapshotAction;
    this.config = config;
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

    try {
      if (typeof localStorage !== "undefined") {
        // TODO custom serializer for each field.
        localStorage.setItem("gonorth", JSON.stringify(snapshot, null, 2));
      }
    } catch (error) {
      console.log("Failed to save game. Could be that storage is disabled or full.");
    }
  }

  /*
   * Retrieve a state snapshot from local storage and dispatch it to the store.
   */
  loadSnapshot() {
    if (typeof localStorage !== "undefined") {
      // TODO custom deserializer.
      const snapshot = JSON.parse(localStorage.getItem("gonorth"));
      this.store.dispatch(this.loadSnapshotAction(snapshot));
    }
  }
}
