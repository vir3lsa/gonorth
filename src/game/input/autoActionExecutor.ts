import { selectAutoActions } from "../../utils/selectors";
import { Context } from "../../types/types";

export async function checkAutoActions(context: Context) {
  for (const autoAction of selectAutoActions()) {
    const result = await autoAction.check(context);

    if (!result) {
      return false;
    }
  }

  return true;
}
