import diff from 'fast-diff';

/**
 * Computes minimal edits using fast-diff.
 * Returns an array of edits compatible with Monaco's ISingleEditOperation,
 * but uses character offsets instead of line/column for simplicity (caller handles conversion).
 */
export const computeMinimalEdits = (oldText, newText) => {
  if (oldText === newText) return [];
  
  const diffs = diff(oldText, newText);
  const edits = [];
  let offset = 0;

  for (const [type, text] of diffs) {
    if (type === 0) { // Same
      offset += text.length;
    } else if (type === -1) { // Deletion
      edits.push({
        startOffset: offset,
        endOffset: offset + text.length,
        text: ''
      });
      offset += text.length;
    } else if (type === 1) { // Insertion
      edits.push({
        startOffset: offset,
        endOffset: offset,
        text: text
      });
    }
  }

  return edits;
};
