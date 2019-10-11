import { toChainableFunction, chainActions } from "../utils/actionChain";

export const TIMEOUT_MILLIS = "TIMEOUT_MILLIS";
export const TIMEOUT_TURNS = "TIMEOUT_TURNS";
export const DORMANT = "DORMANT";
export const PENDING = "PENDING";
export const ACTIVE = "ACTIVE";
export const FINISHED = "FINISHED";
export const CANCELLED = "CANCELLED";

export class Event {
  constructor(action = [], condition, timeout, timeoutType, repetitions) {
    this.action = action;
    this.condition = condition;
    this.timeout = timeout || 0;
    this.timeoutType = timeoutType || TIMEOUT_TURNS;
    this.repetitions = repetitions || 1;
    this.executionCount = 0;
    this.timeoutId = null;
    this.state = DORMANT;
  }

  set action(action) {
    const actionArray = Array.isArray(action) ? action : [action];
    this._action = actionArray.map(toChainableFunction);
  }

  get action() {
    return this._action;
  }

  get condition() {
    return this._condition;
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

  commence() {
    this.state = PENDING;

    if (this.timeout) {
      if (this.timeoutType === TIMEOUT_MILLIS) {
        this.timeoutId = setTimeout(() => this.trigger(), this.timeout);
      } else {
        this.countdown = this.timeout;
      }
    } else {
      // No timeout therefore trigger immediately
      this.trigger();
    }
  }

  tick() {
    if (this.countdown) {
      this.countdown--;

      if (this.countdown === 0) {
        this.trigger();
      }
    }
  }

  trigger() {
    this.state = ACTIVE;
    this.executionCount++;

    if (this.executionCount >= this.repetitions) {
      this.state = FINISHED;
    }

    return chainActions(this.action);
  }

  cancel() {
    this.state = CANCELLED;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}
