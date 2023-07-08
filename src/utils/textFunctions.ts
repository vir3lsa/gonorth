import type { Item } from "../game/items/item";

const vowels = ["a", "e", "i", "o", "u"];

export function getBasicItemList(items: Item[], definiteArticle: boolean = false) {
  if (items.length < 8) {
    return commaSeparate(items, definiteArticle);
  } else {
    return bulletPointList(items, definiteArticle);
  }
}

function commaSeparate(items: Item[], definiteArticle: boolean = false) {
  let text = "";

  items.forEach((item, i) => {
    const prefix = definiteArticle ? "the " : item.article ? `${item.article} ` : "";
    text += `${prefix}${item.name}`;

    if (i < items.length - 2) {
      text += ", ";
    } else if (i < items.length - 1) {
      text += `${items.length > 2 ? "," : ""} and `;
    }
  });

  return text;
}

export function bulletPointList(items: Item[], definiteArticle: boolean = false) {
  return (
    "\n* " +
    items
      .map((item) => {
        const prefix = definiteArticle ? "the " : item.article ? `${item.article} ` : "";
        return `${prefix}${item.name}`;
      })
      .join("\n* ")
  );
}

export function toTitleCase(text: string) {
  return text[0].toUpperCase() + text.slice(1);
}

export function getArticle(name: string) {
  return `a${vowels.includes(name.toLowerCase()[0]) ? "n" : ""}`;
}

export function englishList(elements: string[]) {
  return elements.reduce((list, element, index) => {
    let newList = `${list}${element}`;

    if (index < elements.length - 2) {
      newList += ", ";
    } else if (index < elements.length - 1) {
      newList += " and ";
    }

    return newList;
  }, "");
}
