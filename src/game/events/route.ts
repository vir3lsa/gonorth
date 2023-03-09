import { Schedule } from "./schedule";
import { TIMEOUT_MILLIS, TIMEOUT_TURNS } from "./event";
import { selectRoom } from "../../utils/selectors";

class Builder {
  steps: Step[];
  currentStep?: Step;
  subject?: NpcT;
  condition?: Test;
  continueOnFail = false;
  findPlayerText?: UnknownText;
  direction?: string;
  delay?: number;

  constructor() {
    this.steps = [];
  }

  withSubject(subject: NpcT) {
    this.subject = subject;
    return this;
  }

  withCondition(condition: Test) {
    this.condition = condition;
    return this;
  }

  withContinueOnFail(value: boolean) {
    this.continueOnFail = value;
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

export class Route {
  static get Builder() {
    return Builder;
  }

  schedule;

  constructor(builder: Builder) {
    const scheduleBuilder = new Schedule.Builder()
      .withCondition(builder.condition)
      .withContinueOnFail(builder.continueOnFail);

    builder.steps.forEach((step) => {
      const getText = () => {
        if (builder.subject?.container === selectRoom() && builder.findPlayerText) {
          return builder.findPlayerText;
        }

        return step.text;
      };

      scheduleBuilder
        .addEvent(() => builder.subject?.go(step.direction), getText)
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
