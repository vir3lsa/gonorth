const vowels = ["a", "e", "i", "o", "u"];

export function getBasicItemList(items, definiteArticle) {
  if (items.length < 8) {
    return commaSeparate(items, definiteArticle);
  } else {
    return bulletPointList(items, definiteArticle);
  }
}

function commaSeparate(items, definiteArticle) {
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

export function bulletPointList(items, definiteArticle) {
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

export function toTitleCase(text) {
  return text[0].toUpperCase() + text.slice(1);
}

export function getArticle(name) {
  return `a${vowels.includes(name.toLowerCase()[0]) ? "n" : ""}`;
}

export function englishList(elements) {
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
