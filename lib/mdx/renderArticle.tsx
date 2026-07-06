import { Fragment } from "react";

/**
 * Minimal markdown renderer for article bodies stored as plain strings in data/blog.ts.
 * Supports `## Heading` and paragraph breaks. When MDX is wired up in a later phase,
 * this can be swapped for the mdx pipeline without touching call sites.
 */
export function renderArticleBody(body: string) {
  const blocks = body.trim().split(/\n\n+/);
  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (trimmed.startsWith("## ")) {
      return <h2 key={i}>{trimmed.slice(3)}</h2>;
    }
    if (trimmed.startsWith("# ")) {
      return <h2 key={i}>{trimmed.slice(2)}</h2>;
    }
    return (
      <p key={i}>
        {trimmed.split("\n").map((line, j, arr) => (
          <Fragment key={j}>
            {line}
            {j < arr.length - 1 && <br />}
          </Fragment>
        ))}
      </p>
    );
  });
}
