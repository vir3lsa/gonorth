import { Store } from "redux";

/*
 * Utility class that saves snapshots of a store's state to local storage. It will also retrieve
 * snapshots on demand and dispatch the appropriate store action to apply them.
 */
export class SnapshotPersistor {
  store: Store;
  config: SnapshotPersistorConfig;
  constructor(store: Store, config: SnapshotPersistorConfig) {
    this.store = store;
    this.config = config;
  }

  get key() {
    const modelVersion = this.config?.version;
    const storeName = this.config?.name;
    let key = "gonorth";

    if (storeName) {
      key += `:${storeName}`;
    }

    if (modelVersion) {
      key += `:${modelVersion}`;
    }

    return key;
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
      }, {} as Snapshot);
    } else {
      snapshot = { ...state };
    }

    const replacer = (key: string, value: unknown) => {
      const serializer = this.config.serializers[key];

      if (serializer) {
        return serializer(value);
      }

      return value as Serializable;
    };

    /* Run the replacer on each entry. Doing it here rather than in JSON.stringify() because I
       don't want it to be run recursively on the output. */
    const serializableSnapshot = Object.entries(snapshot).reduce((acc, [key, value]) => {
      acc[key] = replacer(key, value);
      return acc;
    }, {} as Snapshot);

    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(this.key, JSON.stringify(serializableSnapshot));
      }
    } catch (error) {
      console.error("Failed to save game. Could be that storage is disabled or full.", error);
    }
  }

  /**
   * Revives a deserialized value using the appropriate additional deserializer, if any.
   */
  revive(key: string, value: Serializable) {
    const deserializer = this.config.deserializers[key];

    if (deserializer) {
      return deserializer(value);
    }

    return value;
  }

  /*
   * Retrieve a state snapshot from local storage and dispatch it to the store.
   */
  loadSnapshot() {
    if (typeof localStorage !== "undefined") {
      const snapshotString = localStorage.getItem(this.key);

      if (snapshotString) {
        const snapshot = JSON.parse(snapshotString) as Snapshot;

        /* Run the reviver on each entry. Doing it here rather than in JSON.parse() because I
           don't want it to be run recursively on the output. */
        const revivedSnapshot = Object.entries(snapshot).reduce((acc, [key, value]) => {
          acc[key] = this.revive(key, value);
          return acc;
        }, {} as RevivedSnapshot);

        return revivedSnapshot;
      }
    }

    return {};
  }

  purgeSnapshot() {
    localStorage.removeItem(this.key);
  }

  get name() {
    return this.config?.name;
  }

  set name(value) {
    this.config.name = value;
  }
}
