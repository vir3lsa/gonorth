import { selectAutoActions } from "../../utils/selectors";

export async function checkAutoActions(context: Context) {
  for (const autoAction of selectAutoActions()) {
    const result = await autoAction.check(context);

    if (!result) {
      return false;
    }
  }

  return true;
}
