import { Event, SUCCEEDED, EventBuilder } from "./event";

export class ScheduleBuilder {
  id: string;
  events: Event[];
  condition?: boolean | Condition;
  continueOnFail = false;
  isRecurring = false;

  constructor(id: string) {
    this.id = id;
    this.events = [];
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

  addEvents(...events: (Event | EventBuilder)[]) {
    events.forEach((event) => this.addEvent(event));
    return this;
  }

  addEvent(event: Event | EventBuilder) {
    if (event instanceof EventBuilder && !event.name) {
      event.withName(`schedule event ${this.events.length}`);
    }

    const eventObj = event instanceof EventBuilder ? event.build() : event;
    this.events.push(eventObj);
    return this;
  }

  build() {
    if (!this.id) {
      throw Error("Tried to build a Schedule with no ID.");
    }

    return new Schedule(this);
  }
}

export const STATE_READY = "READY";
export const STATE_RUNNING = "RUNNING";
const STATE_COMPLETED = "COMPLETED";

export class Schedule {
  static get Builder() {
    return ScheduleBuilder;
  }

  id: string;
  _condition!: Condition;
  continueOnFail;
  stage: number;
  events: Event[];
  cancelled = false;
  state = STATE_READY;

  constructor(builder: ScheduleBuilder) {
    this.id = builder.id;
    this.condition = builder.condition;
    this.continueOnFail = builder.continueOnFail || false;
    this.stage = 0;

    // Handle to next Event so previous event can trigger it
    let nextEvent: Event;
    // Iterate from last to first so each event can trigger the next
    this.events = builder.events.reverse().map((event, index) => {
      if (index === 0 && builder.isRecurring) {
        // Reset the schedule when it completes
        event.onComplete.addAction(() => this.reset());
      } else if (index === 0) {
        event.onComplete.addAction(() => {
          this.state = STATE_COMPLETED;
        });
      }

      if (nextEvent) {
        // Commence next event
        const nextInChain = nextEvent;
        event.onComplete.addAction(async () => {
          if ((event.state === SUCCEEDED || this.continueOnFail) && !this.cancelled) {
            this.stage++;
            nextInChain.lifecycle();
          }
        });
      }

      return (nextEvent = event);
    });

    // Put events back in the right order
    this.events.reverse();
  }

  set condition(condition: boolean | undefined | Condition) {
    if (typeof condition === "undefined") {
      this._condition = () => false; // Schedule must be triggered manually.
    } else if (typeof condition === "boolean") {
      this._condition = () => condition;
    } else if (typeof condition === "function") {
      this._condition = condition;
    } else {
      throw Error("Schedule condition must be boolean or function.");
    }
  }

  checkCondition() {
    return this._condition ? this._condition() : true;
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
