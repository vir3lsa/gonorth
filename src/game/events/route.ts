import { Schedule, ScheduleBuilder } from "./schedule";
import { Event, TIMEOUT_MILLIS, TIMEOUT_TURNS } from "./event";
import { Condition, NpcT, UnknownText } from "../../types/types";
import { selectRoom } from "../../utils/selectors";

export class RouteBuilder extends ScheduleBuilder {
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

  withDelayTurns(delay: number) {
    if (!this.currentStep) {
      throw Error("Tried to add a delay, but no step has been added. Use 'go()' to add a step.");
    }

    this.currentStep.delayTurns = delay;
    return this;
  }

  withDelayMillis(delay: number) {
    if (!this.currentStep) {
      throw Error("Tried to add a delay, but no step has been added. Use 'go()' to add a step.");
    }

    this.currentStep.delayMillis = delay;
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

export class Step {
  direction: string;
  text?: UnknownText;
  delayTurns?: number;
  delayMillis?: number;

  constructor(direction: string) {
    this.direction = direction;
  }
}

export class Route extends Schedule {
  static get Builder() {
    return RouteBuilder;
  }

  constructor(builder: RouteBuilder) {
    builder.steps.forEach((step) => {
      const getText = () => {
        if (builder.subject?.container === selectRoom() && builder.findPlayerText) {
          return builder.findPlayerText;
        }

        return step.text;
      };

      const stepEvent = new Event.Builder().withActions(() => builder.subject?.go(step.direction), getText);

      if (step.delayTurns !== undefined) {
        stepEvent.withDelayTurns(step.delayTurns);
      }

      if (step.delayMillis !== undefined) {
        stepEvent.withDelayMillis(step.delayMillis);
      }

      builder.addEvent(stepEvent);
    });

    super(builder);
  }
}
