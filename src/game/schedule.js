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

      addEvent() {
        const eventBuilder = new EventBuilder(this);
        this.eventBuilders.push(eventBuilder);
        return eventBuilder;
      }

      build() {
        return new Schedule(this);
      }
    }

    class EventBuilder {
      constructor(scheduleBuilder) {
        this.scheduleBuilder = scheduleBuilder;
      }

      withActions(actions) {
        this.actions = actions;
        return this;
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

      done() {
        return this.scheduleBuilder;
      }
    }

    return Builder;
  }

  constructor(builder) {
    this.continueOnFail = builder.continueOnFail || false;

    // Handle to next Event so previous event can trigger it
    let nextEvent;
    // Iterate from last to first so each event can trigger the next
    this.events = builder.eventBuilders.reverse().map((eventBuilder, index) => {
      let condition;

      if (index === 0) {
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
          if (event.state === SUCCEEDED || this.continueOnFail) {
            nextInChain.commence();
          }
        };
      }

      return (nextEvent = event);
    });

    // Put events back in the right order
    this.events.reverse();
  }

  get firstEvent() {
    return this.events[0];
  }
}
