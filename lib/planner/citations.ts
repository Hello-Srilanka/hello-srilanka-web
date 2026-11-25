export function readCitations(value: string) {
  const ids: string[] = [];
  const text = value.replace(/\[\s*([sk]\d+(?:\s*[,;]\s*[sk]\d+)*)\s*\]/gi, (_, references: string) => {
    ids.push(...references.toLowerCase().split(/\s*[,;]\s*/));
    return ' ';
  });
  return { text: ids.length ? text.replace(/[ \t]+([.,;:!?])/g, '$1').replace(/[ \t]{2,}/g, ' ').trim() : value, ids };
}
