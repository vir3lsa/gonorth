import type { Item } from "../game/items/item";

const vowels = ["a", "e", "i", "o", "u"];

export function getBasicItemList(items: Item[], definiteArticle = false) {
  if (items.length < 8) {
    return commaSeparate(items, definiteArticle);
  } else if (items.length < 14 || window.matchMedia("(max-width: 400px)").matches) {
    return bulletPointList(items, definiteArticle);
  } else {
    if (!window.matchMedia("(min-width: 768px)").matches) {
      return tableOfItems(items, definiteArticle, 2);
    }

    return tableOfItems(items, definiteArticle, 3);
  }
}

function commaSeparate(items: Item[], definiteArticle = false) {
  let text = "";

  items.forEach((item, i) => {
    const prefix = getPrefix(item, definiteArticle);
    text += `${prefix}${item.name}`;

    if (i < items.length - 2) {
      text += ", ";
    } else if (i < items.length - 1) {
      text += `${items.length > 2 ? "," : ""} and `;
    }
  });

  return text;
}

export function bulletPointList(items: Item[], definiteArticle = false) {
  return (
    "\n* " +
    items
      .map((item) => {
        const prefix = getPrefix(item, definiteArticle);
        return `${prefix}${item.name}`;
      })
      .join("\n* ")
  );
}

export function tableOfItems(items: Item[], definiteArticle = false, numCols = 3) {
  let table = "|";

  for (let i = 0; i < numCols; i++) {
    table += " |";
  }

  table += "\n|";

  for (let i = 0; i < numCols; i++) {
    table += ":---|";
  }

  items.forEach((item, index) => {
    if (index % numCols === 0) {
      table += "\n|";
    }

    const prefix = getPrefix(item, definiteArticle);
    table += `${prefix}${item.name}|`;
  });

  return table;
}

const getPrefix = (item: Item, definiteArticle = false) =>
  definiteArticle ? "the " : item.article ? `${item.article} ` : "";

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
