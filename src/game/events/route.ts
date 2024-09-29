import { Schedule, ScheduleBuilder } from "./schedule";
import { Event, TIMEOUT_MILLIS, TIMEOUT_TURNS } from "./event";
import { selectRoom } from "../../utils/selectors";

class Builder extends ScheduleBuilder {
  steps: Step[];
  currentStep?: Step;
  subject?: NpcT;
  condition?: boolean | Condition;
  continueOnFail = false;
  findPlayerText?: UnknownText;
  direction?: string;
  delay?: number;

  constructor(id: string) {
    super(id);
    this.steps = [];
  }

  withSubject(subject: NpcT) {
    this.subject = subject;
    return this;
  }

  withFindPlayerText(text: UnknownText) {
    this.findPlayerText = text;
    return this;
  }

  go(direction: string) {
    this.currentStep = new Step(direction);
    this.steps.push(this.currentStep);
    return this;
  }

  withDelay(delay: number, type: TimeoutType) {
    if (type !== TIMEOUT_MILLIS && type !== TIMEOUT_TURNS) {
      throw Error("Delay type must be one of 'TIMEOUT_MILLIS' and 'TIMEOUT_TURNS'");
    }

    if (!this.currentStep) {
      throw Error("Tried to add a delay, but no step has been added. Use 'go()' to add a step.");
    }

    this.currentStep.delay = delay;
    this.currentStep.delayType = type;
    return this;
  }

  withText(text: UnknownText) {
    if (!this.currentStep) {
      throw Error("Tried to add text, but no step has been added. Use 'go()' to add a step.");
    }

    this.currentStep.text = text;
    return this;
  }

  build() {
    return new Route(this);
  }
}

class Step {
  direction: string;
  text?: UnknownText;
  delay?: number;
  delayType?: TimeoutType;

  constructor(direction: string) {
    this.direction = direction;
  }
}

export class Route extends Schedule {
  static get Builder() {
    return Builder;
  }

  constructor(builder: Builder) {
    builder.steps.forEach((step) => {
      const getText = () => {
        if (builder.subject?.container === selectRoom() && builder.findPlayerText) {
          return builder.findPlayerText;
        }

        return step.text;
      };

      builder.addEvent(
        new Event.Builder()
          .withActions(() => builder.subject?.go(step.direction), getText)
          .withTimeout(step.delay || 0)
          .withTimeoutType(step.delayType || TIMEOUT_TURNS)
      );
    });

    super(builder);
  }
}
