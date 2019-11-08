import { TIMEOUT_MILLIS, TIMEOUT_TURNS, Event, SUCCEEDED } from "./event";

export class Schedule {
  static get Builder() {
    class Builder {
      constructor() {
        this.eventBuilders = [];
      }

      withCondition(condition) {
        this.condition = condition;
        return this;
      }

      withContinueOnFail(value) {
        this.continueOnFail = value;
        return this;
      }

      addEvent(...actions) {
        const eventBuilder = new EventBuilder(this, actions);
        this.eventBuilders.push(eventBuilder);
        return eventBuilder;
      }

      build() {
        return new Schedule(this);
      }
    }

    class EventBuilder {
      constructor(scheduleBuilder, actions) {
        this.scheduleBuilder = scheduleBuilder;
        this.actions = actions;
      }

      withDelay(delay) {
        this.delay = delay;
        return this;
      }

      withDelayType(type) {
        if (type !== TIMEOUT_MILLIS && type !== TIMEOUT_TURNS) {
          throw Error(
            "Delay type must be one of 'TIMEOUT_MILLIS' and 'TIMEOUT_TURNS'"
          );
        }

        this.delayType = type;
        return this;
      }

      addEvent(...actions) {
        return this.scheduleBuilder.addEvent(actions);
      }

      done() {
        return this.scheduleBuilder;
      }
    }

    return Builder;
  }

  constructor(builder) {
    this.continueOnFail = builder.continueOnFail || false;
    this.stage = 0;

    // Handle to next Event so previous event can trigger it
    let nextEvent;
    // Iterate from last to first so each event can trigger the next
    this.events = builder.eventBuilders.reverse().map((eventBuilder, index) => {
      let condition;

      if (index === builder.eventBuilders.length - 1) {
        // Add condition to the last i.e. the first event in the (reversed) schedule
        condition = builder.condition || true;
      }

      const event = new Event(
        eventBuilder.actions,
        condition,
        eventBuilder.delay,
        eventBuilder.delayType
      );

      if (nextEvent) {
        // Commence next event
        const nextInChain = nextEvent;
        event.onComplete = () => {
          if (
            (event.state === SUCCEEDED || this.continueOnFail) &&
            !this.cancelled
          ) {
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

  cancel() {
    this.cancelled = true;
    this.currentEvent.cancel();
  }
}
