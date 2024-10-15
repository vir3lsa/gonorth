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
export const AWAITING_COUNTDOWN = "AWAITING_COUNTDOWN";
export const AWAITING_TIMER = "AWAITING_TIMER";
export const ACTIVE = "ACTIVE";
export const SUCCEEDED = "SUCCEEDED";
export const FAILED = "FAILED";
export const CANCELLED = "CANCELLED";

export class Event {
  private _action!: ActionChain;
  private _condition!: Condition;
  private _triggerCondition!: Condition;
  private _onComplete!: ActionChain;
  name;
  timeout;
  timeoutType: TimeoutType;
  executionCount;
  timeoutId?: NodeJS.Timeout;
  state;
  recurring;
  countdown?: number;

  constructor(builder: EventBuilder) {
    this.name = builder.name!;
    this.action = builder.actions;
    this.condition = builder.condition ?? true;
    this.triggerCondition = builder.triggerCondition ?? true;
    this.timeout = builder.timeout;
    this.timeoutType = builder.timeoutType ?? TIMEOUT_TURNS;
    this.executionCount = 0;
    this.timeoutId = undefined;
    this.state = DORMANT;
    this.onComplete = builder.onComplete ?? [];
    this.recurring = builder.recurring ?? false;
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
    this._condition = this.normaliseCondition(condition);
  }

  get triggerCondition(): Condition {
    return this._triggerCondition;
  }

  set triggerCondition(condition: boolean | undefined | Condition) {
    this._triggerCondition = this.normaliseCondition(condition);
  }

  private normaliseCondition(condition: boolean | undefined | Condition) {
    if (typeof condition === "undefined") {
      return () => true;
    } else if (typeof condition === "boolean") {
      return () => condition;
    } else if (typeof condition === "function") {
      return condition;
    } else {
      throw Error("Event condition and trigger condition must be boolean or function.");
    }
  }

  manualCommence() {
    if (this.state === DORMANT) {
      this.startCountdown();
    }
  }

  tryStartCountdown() {
    if (this.condition()) {
      return this.startCountdown();
    }
  }

  startCountdown() {
    this.state = this.timeoutType === TIMEOUT_TURNS ? AWAITING_COUNTDOWN : AWAITING_TIMER;
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
        this.timeoutId = setTimeout(() => this.tryTrigger(), timeout);

        if (typeof process === "object") {
          // We're running in NodeJS
          this.timeoutId.unref(); // Allow process to exit even when timer is still running (useful for tests).
        }
      } else {
        this.countdown = timeout;
      }
    } else {
      // No timeout therefore trigger immediately
      return this.tryTrigger();
    }
  }

  tick() {
    if (this.timeoutType === TIMEOUT_TURNS && typeof this.countdown !== "undefined") {
      this.countdown--;

      if (this.countdown <= 0) {
        return this.tryTrigger();
      }
    }
  }

  private checkTimer() {
    if (!this.timeoutId) {
      // Event has likely been revived from storage and needs a new timer.
      return this.startCountdown();
    }
  }

  /**
   * Check any trigger condition and then trigger the Event. If the trigger condition isn't
   * met, the Event is reset and the countdown must be restarted.
   * @returns Promise or undefined
   */
  tryTrigger() {
    if (this.triggerCondition && !this.triggerCondition()) {
      return this.reset();
    }

    return this.trigger();
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
    this.countdown = undefined;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }

  async lifecycle() {
    switch (this.state) {
      case DORMANT:
        await this.tryStartCountdown();
        break;
      case AWAITING_COUNTDOWN:
        await this.tick();
        break;
      case AWAITING_TIMER:
        await this.checkTimer();
        break;
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
  triggerCondition: boolean | Condition = true;
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

  withTriggerCondition(condition: boolean | Condition) {
    this.triggerCondition = condition;
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

    return new Event(this);
  }
}
