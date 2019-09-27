import Interaction from "./interaction";

export default class Room {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.firstVisitText = "";
    this.subsequentVisitsText = "";
    this.visits = 0;
  }

  get interaction() {
    if (this.visits) {
      return new Interaction(
        this.subsequentVisitsText ? this.subsequentVisitsText : this.description
      );
    } else {
      return new Interaction(
        this.firstVisitText ? this.firstVisitText : this.description
      );
    }
  }
}
