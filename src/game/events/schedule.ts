import { TIMEOUT_MILLIS, TIMEOUT_TURNS, Event, SUCCEEDED, DORMANT } from "./event";

export class ScheduleBuilder {
  eventBuilders: EventBuilder[];
  condition?: boolean | Condition;
  continueOnFail = false;
  isRecurring = false;

  constructor() {
    this.eventBuilders = [];
  }

  withCondition(condition?: boolean | Condition) {
    this.condition = condition;
    return this;
  }

  withContinueOnFail(value: boolean) {
    this.continueOnFail = value;
    return this;
  }

  recurring() {
    this.isRecurring = true;
    return this;
  }

  addEvent(...actions: Action[]) {
    const eventBuilder = new EventBuilder(this, actions);
    this.eventBuilders.push(eventBuilder);
    return eventBuilder;
  }

  build() {
    return new Schedule(this);
  }
}

class EventBuilder {
  scheduleBuilder: ScheduleBuilder;
  actions: Action[];
  delay?: number;
  delayType?: TimeoutType;

  constructor(scheduleBuilder: ScheduleBuilder, actions: Action[]) {
    this.scheduleBuilder = scheduleBuilder;
    this.actions = actions;
  }

  withDelay(delay?: number, type?: TimeoutType) {
    if (type !== TIMEOUT_MILLIS && type !== TIMEOUT_TURNS) {
      throw Error("Delay type must be one of 'TIMEOUT_MILLIS' and 'TIMEOUT_TURNS'");
    }

    this.delay = delay;
    this.delayType = type;
    return this;
  }

  addEvent(...actions: Action[]) {
    return this.scheduleBuilder.addEvent(actions);
  }

  recurring() {
    return this.scheduleBuilder.recurring();
  }

  build() {
    return this.scheduleBuilder.build();
  }
}

const STATE_READY = "READY";
const STATE_RUNNING = "RUNNING";
const STATE_COMPLETED = "COMPLETED";

export class Schedule {
  static get Builder() {
    return ScheduleBuilder;
  }

  continueOnFail;
  stage: number;
  events: Event[];
  cancelled = false;
  state = STATE_READY;

  constructor(builder: ScheduleBuilder) {
    this.continueOnFail = builder.continueOnFail || false;
    this.stage = 0;
    const numEvents = builder.eventBuilders.length;

    // Handle to next Event so previous event can trigger it
    let nextEvent: Event;
    // Iterate from last to first so each event can trigger the next
    this.events = builder.eventBuilders.reverse().map((eventBuilder, index) => {
      let condition;

      if (index === numEvents - 1) {
        // Add condition to the last i.e. the first event in the (reversed) schedule
        condition = builder.condition || true;
      } else if (index === 0 && builder.isRecurring) {
        // Reset the schedule when it completes
        eventBuilder.actions.unshift(() => this.reset());
      } else if (index === 0) {
        this.state = STATE_COMPLETED;
      }

      const event = new Event(
        `schedule event ${index}`,
        eventBuilder.actions,
        condition,
        eventBuilder.delay,
        eventBuilder.delayType
      );

      if (nextEvent) {
        // Commence next event
        const nextInChain = nextEvent;
        event.onComplete = async () => {
          if ((event.state === SUCCEEDED || this.continueOnFail) && !this.cancelled) {
            this.stage++;
            nextInChain.commence();
          }
        };
      }

      return (nextEvent = event);
    });

    // Put events back in the right order
    this.events.reverse();
  }

  get currentEvent() {
    return this.events[this.stage];
  }

  /*
   * Trigger the first event in the chain if the sequence hasn't already begun.
   */
  async commence(force = false) {
    if (this.state !== STATE_READY && force) {
      this.reset();
    }

    if (this.state === STATE_READY) {
      this.state = STATE_RUNNING;
      // Don't return result as events should be independent of outer chains.
      this.currentEvent.commence();
    }
  }

  cancel() {
    this.cancelled = true;
    this.currentEvent.cancel();
    this.state = STATE_COMPLETED;
  }

  reset() {
    this.cancelled = false;
    this.stage = 0;
    this.events.forEach((event) => event.reset());
    this.state = STATE_READY;
  }
}
