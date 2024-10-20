import { Item, customiseVerbs, omitAliases } from "./item";
import { Verb } from "../verbs/verb";
import { inRoom, normaliseTest } from "../../utils/sharedFunctions";
import { goToRoom } from "../../utils/lifecycle";
import { CyclicText } from "../interactions/text";

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
    verbs,
    items,
    ...remainingConfig
  } = config;
  const door = new Door(
    name,
    description,
    open,
    locked,
    openSuccessText,
    unlockSuccessText,
    aliases,
    key,
    traversals,
    config
  );

  if (verbs) {
    door.addVerbs(...verbs);
  }

  door.addItems(...(items ?? []));
  Object.entries(remainingConfig).forEach(([key, value]) => (door[key] = value));

  customiseVerbs(config.verbCustomisations, door);

  // Remove any unwanted aliases.
  omitAliases(config.omitAliases, door);

  return door;
}

export class Door extends Item {
  static peekSuccessText: CyclicText;

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
    traversals?: Traversal[],
    config?: DoorConfig
  ) {
    super(name, description, false, -1, [], aliases, undefined, config);
    this.open = open;
    this.locked = locked;
    this.key = key;

    const addS = () => (this.config?.plural ? "" : "s");

    if (!config || !config.alwaysOpen) {
      this.addVerb(
        new Verb.Builder("open")
          .withSmartTest(() => !this.locked, config?.onLocked || `The ${name} ${this.isOrAre} locked.`)
          .withSmartTest(() => !this.open, `The ${name} ${this.isOrAre} already open.`)
          .withOnSuccess(() => {
            this.open = true;
          }, openSuccessText ?? `The ${name} open${addS()} relatively easily.`)
      );

      this.addVerb(
        new Verb.Builder("close")
          .withSmartTest(() => this.open, `The ${name} ${this.isOrAre} already closed.`)
          .withOnSuccess(() => {
            this.open = false;
          }, config?.onCloseSuccess ?? `You close the ${name}.`)
      );

      this.addVerb(
        new Verb.Builder("unlock")
          .makePrepositional("with what", true)
          .withSmartTest(() => this.locked, `The ${name} ${this.isOrAre} already unlocked.`)
          .withSmartTest(
            ({ other: key }) => !Boolean(this.key) || Boolean(key),
            config?.onNeedsKey ?? `The ${name} appear${addS()} to need a key.`
          )
          .withSmartTest(
            ({ other: key }) => !Boolean(key) || Boolean(this.key),
            `The ${name} can't be unlocked with a key.`
          )
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
              unlockSuccessText ??
              (door.key ? "The key turns easily in the lock." : `The ${name} unlock${addS()} with a soft *click*.`)
          ])
      );
    }

    if (traversals) {
      // Create a go-through verb from each traversal.
      const traversalToVerb = traversals.reduce((acc, traversal) => {
        const tests = [...traversal.tests, traversal.doorOpenTest].filter((test) => test) as SmartTest[];
        acc[traversal.id] = new Verb.Builder()
          .withName(`${name}-traversal-${traversal.id}`)
          .withTest(...tests)
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
              return traversalVerb?.attemptWithContext({
                ...context,
                verb: traversalVerb,
              });
            } else if (alias && goThroughAllAliases.includes(alias)) {
              return "You can't go that way.";
            } else {
              return "You're not sure how to do that.";
            }
          })
      );

      // Create a peek verb from each traversal.
      const traversalToPeekVerb = traversals.reduce((acc, traversal) => {
        const tests = [...traversal.tests];

        if (!config?.transparent && traversal.doorOpenTest) {
          tests.push(traversal.doorOpenTest);
        }

        acc[traversal.id] = new Verb.Builder()
          .withName(`${name}-peek-${traversal.id}`)
          .withTest(...tests)
          .withOnSuccess(traversal.onPeekSuccess ?? (() => Door.peekText.next(name, traversal.destination)))
          .isRemote()
          .build();
        return acc;
      }, {} as { [index: number]: Verb });

      this.addVerb(
        new Verb.Builder("peek")
          .withAliases("peer", "look through", "look beyond", "look past")
          .withOnSuccess((context) => {
            const traversal = traversals.find((traversal) => traversal.activationCondition(context));
            const traversalId = traversal ? traversal.id : -1;
            const traversalPeekVerb = traversalToPeekVerb[traversalId];

            if (traversalPeekVerb) {
              return traversalPeekVerb.attemptWithContext(context);
            } else {
              return `You can't see beyond the ${name}.`;
            }
          })
      );
    }
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

  tryUnlock(key?: Key) {
    return key ? this.verbs.unlock.attempt(this, key) : this.verbs.unlock.attempt(this);
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

  static get peekText() {
    if (!Door.peekSuccessText) {
      Door.peekSuccessText = new CyclicText(
        (name, destination) => `Beyond the ${name} you can see the ${destination}.`,
        (name, destination) => `Peering carefully through the ${name}, you can make out the ${destination}.`,
        (name, destination) => `You can see through to the ${destination} past the ${name}.`
      );
    }

    return Door.peekSuccessText;
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

  isAlwaysOpen(alwaysOpen = true) {
    this.config.alwaysOpen = alwaysOpen;
    return this;
  }

  isTransparent(transparent = true) {
    this.config.transparent = transparent;
    return this;
  }

  onLocked(onLocked: Action) {
    this.config.onLocked = onLocked;
    return this;
  }

  onNeedsKey(onNeedsKey: Action) {
    this.config.onNeedsKey = onNeedsKey;
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

  onCloseSuccess(onSuccess: Action) {
    this.config.onCloseSuccess = onSuccess;
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

  addTraversal(traversalBuilder: TraversalBuilder, andReverse?: boolean) {
    if (!this.config.traversals) {
      this.config.traversals = [];
    }

    if (andReverse) {
      const reverseBuilder = new TraversalBuilder()
        .withAliases(...traversalBuilder.config.aliases)
        .withOrigin(traversalBuilder.config.destination)
        .withDestination(traversalBuilder.config.origin)
        .withTests(...traversalBuilder.config.tests)
        .withActivationCondition(traversalBuilder.config.activationCondition)
        .onSuccess(traversalBuilder.config.onSuccess)
        .onFailure(traversalBuilder.config.onFailure);

      if (traversalBuilder.config.doorOpenTest) {
        reverseBuilder.withDoorOpenTest(traversalBuilder.config.doorOpenTest.onFailure);
      }

      this.config.traversals.push(reverseBuilder.build());
    }

    this.config.traversals.push(traversalBuilder.build());
    return this;
  }

  build() {
    if (this.config.alwaysOpen && this.config.open === false) {
      throw Error(`Door "${this.config.name}" cannot be both always open and closed.`);
    }

    return newDoor(this.config);
  }
}

class TraversalBuilder {
  static idCounter = 0;

  config: TraversalConfig = {
    aliases: [],
    tests: [],
    onSuccess: [],
    onFailure: [],
  };

  withAliases(...aliases: string[]) {
    this.config.aliases.push(...aliases);
    return this;
  }

  withOrigin(origin?: string) {
    this.config.origin = origin;
    return this;
  }

  withActivationCondition(condition?: Test) {
    this.config.activationCondition = condition;
    return this;
  }

  withTest(test: Test, onFailure: Action) {
    this.config.tests.push({ test: normaliseTest(test), onFailure });
    return this;
  }

  withTests(...tests: SmartTest[]) {
    this.config.tests.push(...tests);
    return this;
  }

  withDoorOpenTest(onFailure?: Action) {
    this.config.doorOpenTest = {
      test: ({ item: door }) => Boolean(door.open),
      onFailure: onFailure || (({ item: door }) => `The ${door!.name} is closed.`),
    };
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

  onPeekSuccess(...onSuccess: Action[]) {
    this.config.onPeekSuccess = onSuccess;
    return this;
  }

  withDestination(destination?: string) {
    this.config.destination = destination;
    return this;
  }

  build() {
    const {
      aliases,
      origin,
      activationCondition,
      tests,
      doorOpenTest,
      onSuccess,
      onFailure,
      onPeekSuccess,
      destination,
    } = this.config;
    let originFunc: TestFunction = () => (origin ? inRoom(origin) : true);
    let activationConditionFunc: TestFunction = originFunc;

    if (activationCondition !== undefined) {
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
      destination,
      activationCondition: activationConditionFunc,
      tests,
      doorOpenTest,
      onSuccess: [...onSuccess, () => goToRoom(destination)],
      onFailure,
      onPeekSuccess,
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

  static get Builder() {
    return KeyBuilder;
  }
}

class KeyBuilder extends Item.Builder {
  constructor(name: string) {
    super(name);
  }

  build() {
    return new Key(this.config.name);
  }
}
