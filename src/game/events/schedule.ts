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

export class Schedule {
  static get Builder() {
    return ScheduleBuilder;
  }

  continueOnFail;
  stage: number;
  events: Event[];
  cancelled = false;

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
        eventBuilder.actions.unshift(() => {
          this.events[0].state = DORMANT;
          this.stage = 0;
        });
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
  commence() {
    if (this.stage === 0) {
      this.currentEvent.commence();
    }
  }

  cancel() {
    this.cancelled = true;
    this.currentEvent.cancel();
  }
}
