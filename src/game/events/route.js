import { Schedule } from "./schedule";
import { TIMEOUT_MILLIS, TIMEOUT_TURNS } from "./event";
import { selectGame } from "../../utils/selectors";

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

      withFindPlayerText(text) {
        this.findPlayerText = text;
        return this;
      }

      go(direction) {
        this.currentStep = new Step(direction);
        this.steps.push(this.currentStep);
        return this;
      }

      withDelay(delay, type) {
        if (type !== TIMEOUT_MILLIS && type !== TIMEOUT_TURNS) {
          throw Error(
            "Delay type must be one of 'TIMEOUT_MILLIS' and 'TIMEOUT_TURNS'"
          );
        }

        this.currentStep.delay = delay;
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
      const getText = () => {
        if (
          builder.subject.container === selectGame().room &&
          builder.findPlayerText
        ) {
          return builder.findPlayerText;
        }

        return step.text;
      };

      scheduleBuilder
        .addEvent(() => builder.subject.go(step.direction), getText)
        .withDelay(step.delay, step.delayType);
    });

    this.schedule = scheduleBuilder.build();
  }

  get currentEvent() {
    return this.schedule.currentEvent;
  }

  cancel() {
    this.schedule.cancel();
  }
}
