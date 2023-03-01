import { OptionGraph } from "../game/interactions/optionGraph";

/* Presents an OptionGraph that asks the player which item they meant when they typed an ambiguous name.
 * @param name The ambiguous name
 * @param items The items that match the name the player entered
 * @param onChoose The function that should be called when the player chooses, passing in the chosen item.
 */
export default function disambiguate(name: string, items: ItemT[], onChoose: DisambiguationCallback) {
  const options: {
    [displayName: string]: string;
  } = {};
  const nodes: GraphNode[] = [];
  let duplicateRealNames = 0;

  items.forEach((item, i) => {
    const id = `option_${i}`;
    let displayName = item.name;

    if (options[item.name]) {
      // We've already got this name!
      duplicateRealNames++;
      displayName = `${displayName} (${duplicateRealNames})`;
    }

    options[displayName] = id;
    nodes.push({
      id,
      actions: () => onChoose(item)
    });
  });

  // Add a cancel option
  options["Cancel"] = "cancel";
  nodes.push({
    id: "cancel"
  });

  // Add the root node
  nodes.unshift({
    id: "disambiguation",
    actions: `Which ${name} do you mean?`,
    options
  });

  const optionGraph = new OptionGraph("disambiguation", ...nodes);

  // TODO Bug in ActionChain that means options are rendered even though OptionChain.renderOptions is false
  return optionGraph.commence().chain();
}
