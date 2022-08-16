import { selectAutoActions } from "../../utils/selectors";

export async function checkAutoActions(context) {
  for (const autoAction of selectAutoActions()) {
    const result = await autoAction.check(context);

    if (!result) {
      return false;
    }
  }

  return true;
}
