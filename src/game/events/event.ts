import { ActionChain } from "../../utils/actionChain";
import { debug } from "../../utils/consoleIO";
import {
  selectActionChainPromise,
  selectEventTimeoutOverride,
  selectEventTurnsOverride,
  selectOptions
} from "../../utils/selectors";

export const TIMEOUT_MILLIS = "TIMEOUT_MILLIS";
export const TIMEOUT_TURNS = "TIMEOUT_TURNS";
export const TIMEOUT_MILLIS_OR_TURNS = "TIMEOUT_MILLIS_OR_TURNS";
export const DORMANT = "DORMANT";
export const AWAITING_COUNTDOWN = "AWAITING_COUNTDOWN";
export const AWAITING_TIMER = "AWAITING_TIMER";
export const AWAITING_COUNTDOWN_AND_TIMER = "AWAITING_COUNTDOWN_AND_TIMER";
export const ACTIVE = "ACTIVE";
export const SUCCEEDED = "SUCCEEDED";
export const FAILED = "FAILED";
export const CANCELLED = "CANCELLED";

/**
 * An Event defines an action or actions that might occur at some point in the future. They may optionallly be given a condition
 * that will cause them to commence their countdown, or they may be started manually. Delays may be in the form of time (i.e.
 * milliseconds), or turns, or both (whichever comes sooner).
 *
 * Events may be recurring, in which case they may trigger more than once. In this case, care should be taken to ensure they have
 * non-zero delays or conditions that prevent them triggering in an infinite loop. Both commencement (i.e. countdown) delays and
 * trigger delays may be provided.
 *
 * Events may be used within {@link game/events/schedule!Schedule | Schedules}, in which case they are automatically invoked when
 * the previous Event in the Schedule has completed. Within Schedules, Events may optionally be given addition conditions for
 * their activation.
 */
export class Event {
  private _action!: ActionChain;
  private _condition!: Condition;
  private _triggerCondition!: Condition;
  private _onComplete!: ActionChain;
  name;
  delayMillis?: NumberFunction;
  delayTurns?: NumberFunction;
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
    this.delayMillis = builder.delayMillis;
    this.delayTurns = builder.delayTurns;
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

  async startCountdown() {
    if (this.delayMillis !== undefined && this.delayTurns !== undefined) {
      this.state = AWAITING_COUNTDOWN_AND_TIMER;
    } else {
      this.state = this.delayMillis === undefined ? AWAITING_COUNTDOWN : AWAITING_TIMER;
    }

    if (this.delayMillis !== undefined) {
      await this.startTimeCountdown();
    }

    if (this.delayTurns !== undefined || this.delayMillis === undefined) {
      // Default
      await this.startTurnsCountdown();
    }
  }

  private checkSafety(delay?: number) {
    if (this.recurring && delay === 0) {
      if (!this.condition && !this.triggerCondition) {
        throw Error(
          `Event ${this.name} is recurring, has no conditions, and has a delay of zero. This will cause an infinite loop.`
        );
      } else {
        debug(
          `Event ${this.name} is recurring and has a delay of zero. This could cause an infinite loop if not properly restricted by conditions.`,
          false,
          true
        );
      }
    }
  }

  private startTurnsCountdown() {
    const turnsOverride = selectEventTurnsOverride();
    const delayTurnsValue = this.delayTurns?.({ event: this });
    let timeout = delayTurnsValue;

    if (turnsOverride !== undefined) {
      timeout = turnsOverride;
    }

    this.checkSafety(timeout);

    if (delayTurnsValue) {
      this.countdown = timeout;
    } else {
      // No timeout therefore trigger immediately
      return this.tryTrigger();
    }
  }

  private startTimeCountdown() {
    const timeoutOverride = selectEventTimeoutOverride();
    const delayMillisValue = this.delayMillis?.({ event: this });
    let timeout = delayMillisValue;

    if (timeoutOverride !== undefined) {
      timeout = timeoutOverride;
    }

    this.checkSafety(timeout);

    if (delayMillisValue) {
      this.timeoutId = setTimeout(() => this.tryTrigger(), timeout);

      if (typeof process === "object") {
        // We're running in NodeJS
        this.timeoutId.unref(); // Allow process to exit even when timer is still running (useful for tests).
      }
    } else {
      // No timeout therefore trigger immediately
      return this.tryTrigger();
    }
  }

  tick() {
    if (this.delayTurns !== undefined && this.countdown !== undefined) {
      this.countdown--;

      if (this.countdown <= 0) {
        return this.tryTrigger();
      }
    }
  }

  private checkTimer() {
    if (!this.timeoutId) {
      // Event has likely been revived from storage and needs a new timer.
      return this.startTimeCountdown();
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

    if (this.state === ACTIVE) {
      // Don't want to trigger more than once.
      return;
    }

    // Tidy up
    clearTimeout(this.timeoutId);
    this.countdown = undefined;

    while ((chainPromise = selectActionChainPromise())) {
      // Don't start the event until no action chains are running
      await chainPromise;
    }

    this.state = ACTIVE;
    this.executionCount++;

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
      this.reset();

      if (this.delayTurns !== undefined || this.delayMillis !== undefined) {
        this.tryStartCountdown();
      }
    }
  }

  cancel() {
    this.state = CANCELLED;
    clearTimeout(this.timeoutId);
  }

  reset() {
    this.state = DORMANT;
    this.countdown = undefined;

    clearTimeout(this.timeoutId);
    this.timeoutId = undefined;
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
      case AWAITING_COUNTDOWN_AND_TIMER:
        await this.checkTimer();
        await this.tick();
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
  delayMillis?: NumberFunction;
  delayTurns?: NumberFunction;
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

  withDelayMillis(delay: NumberResolve) {
    this.delayMillis = typeof delay === "number" ? () => delay : delay;
    return this;
  }

  withDelayTurns(delay: NumberResolve) {
    this.delayTurns = typeof delay === "number" ? () => delay : delay;
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

    if (!this.actions) {
      this.actions = [];
    }

    if (!this.actions.length) {
      // Add a do-nothing action so that, for example, this Event can be used as a delay in a Schedule.
      this.actions.push(() => undefined);
    }

    return new Event(this);
  }
}
