/** Turns a project story (bullets, lines, or an old "Context: … Outcome: …" paragraph) into crisp points. */
export function storyPoints(story: string): string[] {
  const clean = (line: string) => line.replace(/^\s*(?:[-•*–·▪]|\d+[.)])\s*/, "").replace(/^(context|contribution|outcome|impact|result|role)s?\s*:\s*/i, "").trim();
  const lines = story.split(/\n+/).map(clean).filter(Boolean);
  if (lines.length > 1) return lines;
  const labelled = story.split(/\s*(?=\b(?:Context|Contribution|Outcome|Impact|Result)s?\s*:)/i).map(clean).filter(Boolean);
  if (labelled.length > 1) return labelled;
  return lines;
}
