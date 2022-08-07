import { selectAutoActions } from "../../utils/selectors";

export async function checkAutoActions(context) {
  for (const autoAction of selectAutoActions()) {
    await autoAction.check(context);
  }
}
