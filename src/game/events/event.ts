import { ActionChain } from "../../utils/actionChain";
import {
  selectActionChainPromise,
  selectEventTimeoutOverride,
  selectEventTurnsOverride,
  selectOptions
} from "../../utils/selectors";
import { normaliseTest } from "../../utils/sharedFunctions";

export const TIMEOUT_MILLIS = "TIMEOUT_MILLIS";
export const TIMEOUT_TURNS = "TIMEOUT_TURNS";
export const DORMANT = "DORMANT";
export const PENDING = "PENDING";
export const ACTIVE = "ACTIVE";
export const SUCCEEDED = "SUCCEEDED";
export const FAILED = "FAILED";
export const CANCELLED = "CANCELLED";

export class Event {
  name;
  _action!: ActionChain;
  _condition!: Condition;
  timeout;
  timeoutType: TimeoutType;
  executionCount;
  timeoutId?: NodeJS.Timeout;
  state;
  _onComplete!: ActionChain;
  recurring;
  countdown?: number;

  constructor(
    name: string,
    action: Action = [],
    condition: boolean | Condition = true,
    timeout = 0,
    timeoutType: TimeoutType = TIMEOUT_TURNS,
    onComplete: Action = [],
    recurring = false
  ) {
    this.name = name;
    this.action = action;
    this.condition = condition;
    this.timeout = timeout;
    this.timeoutType = timeoutType;
    this.executionCount = 0;
    this.timeoutId = undefined;
    this.state = DORMANT;
    this.onComplete = onComplete;
    this.recurring = recurring;
  }

  set action(action: Action) {
    const actionArray = Array.isArray(action) ? action : [action];
    this._action = new ActionChain(...actionArray);
  }

  get action(): ActionChain {
    return this._action;
  }

  get condition(): Condition {
    return this._condition;
  }

  set onComplete(onComplete: Action) {
    const actionArray = Array.isArray(onComplete) ? onComplete : [onComplete];
    this._onComplete = new ActionChain(...actionArray);
  }

  get onComplete(): ActionChain {
    return this._onComplete;
  }

  set condition(condition: boolean | undefined | Condition) {
    if (typeof condition === "undefined") {
      this._condition = () => true;
    } else if (typeof condition === "boolean") {
      this._condition = () => condition;
    } else if (typeof condition === "function") {
      this._condition = condition;
    } else {
      throw Error("Event condition must be boolean or function.");
    }
  }

  manualCommence() {
    if (this.state === DORMANT) {
      this.commence();
    }
  }

  commence() {
    this.state = PENDING;
    const timeoutOverride = selectEventTimeoutOverride();
    const turnsOverride = selectEventTurnsOverride();
    let timeout = this.timeout;

    if (this.timeoutType === TIMEOUT_MILLIS && typeof timeoutOverride !== "undefined") {
      timeout = timeoutOverride;
    } else if (this.timeoutType === TIMEOUT_TURNS && typeof turnsOverride !== "undefined") {
      timeout = turnsOverride;
    }

    if (this.timeout) {
      if (this.timeoutType === TIMEOUT_MILLIS) {
        this.timeoutId = setTimeout(() => this.trigger(), timeout);
      } else {
        this.countdown = timeout;
      }
    } else {
      // No timeout therefore trigger immediately
      return this.trigger();
    }
  }

  tick() {
    if (typeof this.countdown !== "undefined") {
      this.countdown--;

      if (this.countdown <= 0) {
        return this.trigger();
      }
    }
  }

  async trigger() {
    let chainPromise;

    while ((chainPromise = selectActionChainPromise())) {
      // Don't start the event until no action chains are running
      await chainPromise;
    }

    this.state = ACTIVE;

    // Ensure the original options are restored after the interruption
    const currentOptions = selectOptions();
    this.action.options = currentOptions;

    const result = await this.action.chain();

    if (result === false) {
      this.state = FAILED;
    } else {
      this.state = SUCCEEDED;
    }

    await this.onComplete.chain();

    if (this.recurring) {
      this.state = DORMANT;
    }
  }

  cancel() {
    this.state = CANCELLED;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  reset() {
    this.state = DORMANT;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  static get Builder() {
    return EventBuilder;
  }
}

export class EventBuilder {
  name;
  actions?: Action[];
  condition: boolean | Condition = true;
  timeout?: number;
  timeoutType?: TimeoutType;
  onComplete?: Action[];
  recurring: boolean = false;

  constructor(name?: string) {
    this.name = name;
  }

  withName(name: string) {
    this.name = name;
  }

  withAction(action: Action) {
    if (!this.actions) {
      this.actions = [];
    }

    this.actions.push(action);
    return this;
  }

  withActions(...actions: Action[]) {
    if (!this.actions) {
      this.actions = [];
    }

    this.actions = [...this.actions, ...actions];
    return this;
  }

  withCondition(condition: boolean | Condition) {
    this.condition = condition;
    return this;
  }

  withDelay(delay: number, timeoutType: TimeoutType) {
    this.withTimeout(delay);
    this.withTimeoutType(timeoutType);
    return this;
  }

  withTimeout(timeout: number) {
    this.timeout = timeout;
    return this;
  }

  withTimeoutType(timeoutType: TimeoutType) {
    this.timeoutType = timeoutType;
    return this;
  }

  withOnComplete(...onComplete: Action[]) {
    if (!this.onComplete) {
      this.onComplete = [];
    }

    this.onComplete.push(onComplete);
    return this;
  }

  isRecurring(recurring = true) {
    this.recurring = recurring;
    return this;
  }

  build() {
    if (!this.name) {
      throw Error("Must provide a name for each Event.");
    }

    return new Event(
      this.name,
      this.actions,
      this.condition,
      this.timeout,
      this.timeoutType,
      this.onComplete,
      this.recurring
    );
  }
}
