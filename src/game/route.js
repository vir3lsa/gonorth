import { Schedule } from "./schedule";
import { TIMEOUT_MILLIS, TIMEOUT_TURNS } from "./event";

export class Route {
  static get Builder() {
    class Builder {
      constructor() {
        this.steps = [];
        this.currentStep = null;
      }

      withSubject(subject) {
        this.subject = subject;
        return this;
      }

      withCondition(condition) {
        this.condition = condition;
        return this;
      }

      withContinueOnFail(value) {
        this.continueOnFail = value;
        return this;
      }

      go(direction) {
        this.currentStep = new Step(direction);
        this.steps.push(this.currentStep);
        return this;
      }

      withDelay(delay) {
        this.currentStep.delay = delay;
        return this;
      }

      withDelayType(type) {
        if (type !== TIMEOUT_MILLIS && type !== TIMEOUT_TURNS) {
          throw Error(
            "Delay type must be one of 'TIMEOUT_MILLIS' and 'TIMEOUT_TURNS'"
          );
        }

        this.currentStep.delayType = type;
        return this;
      }

      withText(text) {
        this.currentStep.text = text;
        return this;
      }

      build() {
        return new Route(this);
      }
    }

    class Step {
      constructor(direction) {
        this.direction = direction;
      }
    }

    return Builder;
  }

  constructor(builder) {
    const scheduleBuilder = new Schedule.Builder()
      .withCondition(builder.condition)
      .withContinueOnFail(builder.continueOnFail);

    builder.steps.forEach(step => {
      scheduleBuilder
        .addEvent(() => builder.subject.go(step.direction), step.text)
        .withDelay(step.delay)
        .withDelayType(step.delayType);
    });

    this.schedule = scheduleBuilder.build();
  }

  get currentEvent() {
    return this.schedule.currentEvent;
  }
}
