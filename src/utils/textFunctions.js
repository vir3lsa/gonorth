export function getBasicItemList(items) {
  let text = "";

  items.forEach((item, i) => {
    text += `${item.article} ${item.name}`;

    if (i < items.length - 2) {
      text += ", ";
    } else if (i < items.length - 1) {
      text += " and ";
    }
  });

  return text;
}

export function toTitleCase(text) {
  return text[0].toUpperCase() + text.slice(1);
}
