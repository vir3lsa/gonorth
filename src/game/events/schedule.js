import {
  TIMEOUT_MILLIS,
  TIMEOUT_TURNS,
  Event,
  SUCCEEDED,
  DORMANT
} from "./event";

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

      recurring() {
        this.isRecurring = true;
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

      withDelay(delay, type) {
        if (type !== TIMEOUT_MILLIS && type !== TIMEOUT_TURNS) {
          throw Error(
            "Delay type must be one of 'TIMEOUT_MILLIS' and 'TIMEOUT_TURNS'"
          );
        }

        this.delay = delay;
        this.delayType = type;
        return this;
      }

      addEvent(...actions) {
        return this.scheduleBuilder.addEvent(actions);
      }

      recurring() {
        return this.scheduleBuilder.recurring();
      }

      build() {
        return this.scheduleBuilder.build();
      }
    }

    return Builder;
  }

  constructor(builder) {
    this.continueOnFail = builder.continueOnFail || false;
    this.stage = 0;
    const numEvents = builder.eventBuilders.length;

    // Handle to next Event so previous event can trigger it
    let nextEvent;
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
