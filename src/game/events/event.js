import { ActionChain } from "../../utils/actionChain";
import {
  selectActionChainPromise,
  selectEventTimeoutOverride,
  selectEventTurnsOverride,
  selectOptions
} from "../../utils/selectors";

export const TIMEOUT_MILLIS = "TIMEOUT_MILLIS";
export const TIMEOUT_TURNS = "TIMEOUT_TURNS";
export const DORMANT = "DORMANT";
export const PENDING = "PENDING";
export const ACTIVE = "ACTIVE";
export const SUCCEEDED = "SUCCEEDED";
export const FAILED = "FAILED";
export const CANCELLED = "CANCELLED";

export class Event {
  /**
   *
   * @param {*} name
   * @param {*} action
   * @param {Test} condition
   * @param {*} timeout
   * @param {*} timeoutType
   * @param {*} onComplete
   * @param {*} recurring
   */
  constructor(
    name,
    action = [],
    condition = true,
    timeout = 0,
    timeoutType = TIMEOUT_TURNS,
    onComplete = () => {},
    recurring = false
  ) {
    this.name = name;
    this.action = action;
    this.condition = condition;
    this.timeout = timeout;
    this.timeoutType = timeoutType;
    this.executionCount = 0;
    this.timeoutId = null;
    this.state = DORMANT;
    this.onComplete = onComplete;
    this.recurring = recurring;
  }

  set action(action) {
    const actionArray = Array.isArray(action) ? action : [action];
    this._action = new ActionChain(...actionArray);
    this._action.renderOptions = true;
  }

  get action() {
    return this._action;
  }

  get condition() {
    return this._condition;
  }

  set onComplete(onComplete) {
    if (typeof onComplete !== "function") {
      throw Error("onComplete must be a function");
    }

    this._onComplete = onComplete;
  }

  get onComplete() {
    return this._onComplete;
  }

  set condition(condition) {
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

    if (this.timeoutType === TIMEOUT_MILLIS && timeoutOverride) {
      timeout = timeoutOverride;
    } else if (this.timeoutType === TIMEOUT_TURNS && turnsOverride) {
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
    if (this.countdown) {
      this.countdown--;

      if (this.countdown === 0) {
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

    await this.onComplete();

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

  static get Builder() {
    return EventBuilder;
  }
}

class EventBuilder {
  constructor(name) {
    this.name = name;
  }

  withAction(action) {
    if (!this.actions) {
      this.actions = [];
    }

    this.actions.push(action);
    return this;
  }

  withActions(...actions) {
    if (!this.actions) {
      this.actions = [];
    }

    this.actions = [...this.actions, ...actions];
    return this;
  }

  withCondition(condition) {
    this.condition = condition;
    return this;
  }

  withTimeout(timeout) {
    this.timeout = timeout;
    return this;
  }

  withTimeoutType(timeoutType) {
    this.timeoutType = timeoutType;
    return this;
  }

  withOnComplete(onComplete) {
    this.onComplete = onComplete;
    return this;
  }

  isRecurring(recurring = true) {
    this.recurring = recurring;
    return this;
  }

  build() {
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