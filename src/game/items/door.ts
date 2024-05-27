import { Item, customiseVerbs } from "./item";
import { Verb } from "../verbs/verb";
import { inRoom, normaliseTest } from "../../utils/sharedFunctions";
import { goToRoom } from "../../utils/lifecycle";

export function newDoor(config: DoorConfig & ItemConfig) {
  const {
    name,
    description,
    open,
    locked,
    openSuccessText,
    unlockSuccessText,
    aliases,
    key,
    traversals,
    ...remainingConfig
  } = config;
  const door = new Door(name, description, open, locked, openSuccessText, unlockSuccessText, aliases, key, traversals);
  Object.entries(remainingConfig).forEach(([key, value]) => (door[key] = value));

  customiseVerbs(config.verbCustomisations, door);

  return door;
}

export class Door extends Item {
  private _open!: boolean;
  private _locked!: boolean;
  private _key?: KeyT;

  constructor(
    name: string,
    description: UnknownText,
    open = true,
    locked = false,
    openSuccessText?: Action,
    unlockSuccessText?: Action,
    aliases?: string[],
    key?: KeyT,
    traversals?: Traversal[]
  ) {
    super(name, description, false, -1, [], aliases);
    this.open = open;
    this.locked = locked;
    this.key = key;

    this.addVerb(
      new Verb.Builder("open")
        .withSmartTest(() => !this.locked, `The ${name} is locked.`)
        .withSmartTest(() => !this.open, `The ${name} is already open.`)
        .withOnSuccess(() => {
          this.open = true;
        }, openSuccessText || `The ${name} opens relatively easily.`)
        .build()
    );

    this.addVerb(
      new Verb.Builder("close")
        .withSmartTest(() => this.open, `The ${name} is already closed.`)
        .withOnSuccess(() => {
          this.open = false;
        }, `You close the ${name}.`)
        .build()
    );

    this.addVerb(
      new Verb.Builder("unlock")
        .withSmartTest(() => this.locked, `The ${name} is already unlocked.`)
        .withSmartTest(({ other: key }) => !Boolean(this.key) || Boolean(key), `The ${name} appears to need a key.`)
        .withSmartTest(
          ({ other: key }) => (this.key ? this.key.name === key!.name : true),
          ({ other: key }) => `The ${key!.name} doesn't fit.`
        )
        .withOnSuccess([
          ({ item: door }) => {
            // Ensure we don't return false to avoid breaking the action chain.
            door.locked = false;
          },
          ({ item: door }) =>
            unlockSuccessText ||
            (door.key ? "The key turns easily in the lock." : `The ${name} unlocks with a soft *click*.`)
        ])
        .build()
    );

    if (traversals) {
      // Create a verb from each traversal.
      const traversalToVerb = traversals.reduce((acc, traversal) => {
        acc[traversal.id] = new Verb.Builder()
          .withName(`${name}-traversal-${traversal.id}`)
          .withTest(...traversal.tests)
          .withOnSuccess(traversal.onSuccess)
          .withOnFailure(traversal.onFailure)
          .isRemote()
          .build();
        return acc;
      }, {} as { [index: number]: Verb });

      const goThroughAliases = ["traverse", "enter", "use"];
      const goThroughAllAliases = ["go through", ...goThroughAliases];
      const traversalAliases = traversals
        .filter((traversal) => traversal.aliases.length)
        .flatMap((traversal) => traversal.aliases);

      this.addVerb(
        new Verb.Builder("go through")
          .withAliases(...goThroughAliases, ...traversalAliases)
          .withOnSuccess((context) => {
            const { alias } = context;
            const traversal = traversals.find(
              (traversal) =>
                traversal.activationCondition(context) &&
                (!alias || goThroughAllAliases.includes(alias) || traversal.aliases.includes(alias))
            );
            const traversalId = traversal ? traversal.id : -1;
            const traversalVerb = traversalToVerb[traversalId];

            if (traversalVerb) {
              return traversalVerb?.attemptWithContext({ ...context, verb: traversalVerb });
            } else if (alias && goThroughAllAliases.includes(alias)) {
              return "You can't go that way.";
            } else {
              return "You're not sure how to do that.";
            }
          })
          .build()
      );
    }

    this.verbs.unlock.makePrepositional("with what", true);
  }

  get open() {
    return this._open;
  }

  set open(value) {
    this.recordAlteredProperty("open", value);
    this._open = value;
  }

  get locked() {
    return this._locked;
  }

  set locked(value) {
    this.recordAlteredProperty("locked", value);
    this._locked = value;
  }

  get key() {
    return this._key;
  }

  set key(key) {
    if (key && !(key instanceof Key)) {
      throw Error("Keys must be Key instances.");
    }

    this.recordAlteredProperty("key", key);
    this._key = key;
  }

  tryUnlock() {
    return this.verbs.unlock.attempt(this, this.key);
  }

  tryOpen() {
    return this.verbs.open.attempt(this);
  }

  tryClose() {
    return this.verbs.close.attempt(this);
  }

  static get Builder() {
    return DoorBuilder;
  }

  static get TraversalBuilder() {
    return TraversalBuilder;
  }
}

class DoorBuilder extends Item.Builder {
  config!: DoorConfig & ItemConfig;

  constructor(name: string) {
    super(name);
  }

  isOpen(open = true) {
    this.config.open = open;
    return this;
  }

  isLocked(locked = true) {
    this.config.locked = locked;
    return this;
  }

  withOpenSuccessText(onSuccess: Action) {
    this.config.openSuccessText = onSuccess;
    return this;
  }

  withUnlockSuccessText(onSuccess: Action) {
    this.config.unlockSuccessText = onSuccess;
    return this;
  }

  onOpenSuccess(onSuccess: Action) {
    this.config.openSuccessText = onSuccess;
    return this;
  }

  onUnlockSuccess(onSuccess: Action) {
    this.config.unlockSuccessText = onSuccess;
    return this;
  }

  withKey(key: Key) {
    this.config.key = key;
    return this;
  }

  addTraversal(traversalBuilder: TraversalBuilder) {
    if (!this.config.traversals) {
      this.config.traversals = [];
    }

    this.config.traversals.push(traversalBuilder.build());
    return this;
  }

  build() {
    return newDoor(this.config);
  }
}

class TraversalBuilder {
  static idCounter = 0;

  config: TraversalConfig = {
    aliases: [],
    tests: [],
    onSuccess: [],
    onFailure: []
  };

  withAliases(...aliases: string[]) {
    this.config.aliases = [...this.config.aliases, ...aliases];
    return this;
  }

  withOrigin(origin: string) {
    this.config.origin = origin;
    return this;
  }

  withActivationCondition(condition: Test) {
    this.config.activationCondition = condition;
    return this;
  }

  withTest(test: Test, onFailure: Action) {
    this.config.tests.push({ test: normaliseTest(test), onFailure });
    return this;
  }

  withDoorOpenTest(onFailure?: Action) {
    this.config.tests.push({
      test: ({ item: door }) => Boolean(door.open),
      onFailure: onFailure || (({ item: door }) => `The ${door!.name} is closed.`)
    });
    return this;
  }

  onSuccess(...onSuccess: Action[]) {
    this.config.onSuccess = [...this.config.onSuccess, ...onSuccess];
    return this;
  }

  onFailure(...onFailure: Action[]) {
    this.config.onFailure = [...this.config.onFailure, ...onFailure];
    return this;
  }

  withDestination(destination: string) {
    this.config.destination = destination;
    return this;
  }

  build() {
    const { aliases, origin, activationCondition, tests, onSuccess, onFailure, destination } = this.config;
    let originFunc: TestFunction = () => (origin ? inRoom(origin) : true);
    let activationConditionFunc: TestFunction = originFunc;

    if (activationCondition) {
      const normalActCond = normaliseTest(activationCondition);
      activationConditionFunc = (context) => originFunc(context) && normalActCond(context);
    }

    if (!origin && !activationCondition) {
      throw Error("Tried to create Door Traversal but neither origin nor activationCondition were set.");
    }

    if (!destination) {
      throw Error("Tried to create Door Traversal but destination was not set.");
    }

    return {
      id: TraversalBuilder.idCounter++,
      aliases,
      activationCondition: activationConditionFunc,
      tests,
      onSuccess: [...onSuccess, () => goToRoom(destination)],
      onFailure
    } as Traversal;
  }
}

/*
 * Item subclass acting as a key. No special functionality, but doors expect keys to be instances
 * of this class.
 */
export class Key extends Item {
  clone(): KeyT {
    return super.clone(Key);
  }
}
