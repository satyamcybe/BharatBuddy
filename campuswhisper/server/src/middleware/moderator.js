const Filter = require('bad-words');

const filter = new Filter();

/**
 * Replace bad words in text with asterisks.
 * @param {string} text
 * @returns {string}
 */
function filterContent(text) {
  if (typeof text !== 'string') return text;
  try {
    return filter.clean(text);
  } catch {
    // bad-words throws if the entire string is a profanity — return asterisks
    return text.replace(/\S/g, '*');
  }
}

/**
 * Moderate a content string.
 * @param {string} content
 * @returns {{ filtered: string, wasFiltered: boolean }}
 */
function moderate(content) {
  if (typeof content !== 'string') return { filtered: content, wasFiltered: false };
  const filtered = filterContent(content);
  return {
    filtered,
    wasFiltered: filtered !== content,
  };
}

module.exports = { filterContent, moderate };
