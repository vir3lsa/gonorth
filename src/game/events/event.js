import { ActionChain } from "../../utils/actionChain";
import { getStore } from "../../redux/storeRegistry";

export const TIMEOUT_MILLIS = "TIMEOUT_MILLIS";
export const TIMEOUT_TURNS = "TIMEOUT_TURNS";
export const DORMANT = "DORMANT";
export const PENDING = "PENDING";
export const ACTIVE = "ACTIVE";
export const SUCCEEDED = "SUCCEEDED";
export const FAILED = "FAILED";
export const CANCELLED = "CANCELLED";

export class Event {
  constructor(
    name,
    action = [],
    condition,
    timeout,
    timeoutType,
    onComplete = () => {},
    recurring = false
  ) {
    this.name = name;
    this.action = action;
    this.condition = condition;
    this.timeout = timeout || 0;
    this.timeoutType = timeoutType || TIMEOUT_TURNS;
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

    while ((chainPromise = getStore().getState().game.actionChainPromise)) {
      // Don't start the event until no action chains are running
      await chainPromise;
    }

    this.state = ACTIVE;
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
}
