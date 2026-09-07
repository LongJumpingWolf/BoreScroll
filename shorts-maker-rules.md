# Shorts Maker — Rules & Prompt

A reusable prompt for turning any long chapter/document into the "Shorts" format
your reader (`index.html`) already parses: `## SLIDE N: Title` blocks separated
by `---`, one atomic idea each. Works with Claude, ChatGPT, DeepSeek, whatever —
it's plain instructions, no tool-specific syntax.

Two output formats are supported by the reader. Default to Markdown unless you
ask for JSON.

Card bodies support real Markdown (bold, italic, underline, code, bullets,
numbered lists, blockquotes, tables), fenced `mermaid` blocks for rendered
diagrams, fenced `html` blocks for raw layout, and `{{fig: Fig 7.4}}` tags
that render as a chip pointing to the source figure.

---

## The rules (paste these as-is, every time)

```
You are converting a long source document into "Shorts" — short, scrollable
study cards, one atomic idea per card. Follow these rules exactly.

CONTENT RULES
1. Use the source text verbatim, never paraphrase. Every card body should be
   pulled directly from the source's own words. Light trimming (cutting a
   leading "So," or a dangling connector, fixing a stray typo) is fine, but
   don't rewrite, rephrase, or compress sentence structure — the point is to
   preserve the original wording exactly.
2. One card = one idea. If a source paragraph contains three distinct facts,
   that's three cards, not one dense card. Never combine unrelated concepts
   just to save space. Split verbatim, don't blend or reword to fit.
3. Cover the entire source, in order. Do not silently skip sections. If you
   deliberately cut something as too minor to card-ify (e.g. a passing
   cross-reference), note it in a final "Skipped" list rather than dropping it
   silently.
4. Preserve every fact, name, date, and detail exactly as written — numbers,
   named exceptions, specific phrasing, mechanisms — with no substitution or
   summarizing.
5. No filler cards. Don't manufacture a "summary" or "in conclusion" card that
   doesn't exist in the source's structure.

FORMATTING RULES
6. The reader renders real Markdown inside card bodies, so use it wherever
   the source's own structure calls for it (don't add formatting that isn't
   there in the source): **bold**, *italic*/_italic_, __underline__, `code`,
   `- bullets`, `1. numbered lists`, `> blockquotes`, and full Markdown
   tables (header row + `|---|---|` + data rows) — use a real table instead
   of flattening tabular source content into a paragraph.
7. For flowcharts or diagrams described in the source, use a fenced
   ```mermaid``` code block so it renders as an actual diagram rather than
   describing the diagram in prose.
8. For a layout that's awkward in plain Markdown (a complex table, a custom
   arrangement), use a fenced ```html``` code block instead — it gets
   inserted raw into the card.
9. Any card that corresponds to a source figure/image gets a
   `{{fig: Fig 7.4}}` tag (use the source's own figure label) placed in the
   card body. Never invent or reproduce the image itself — this tag alone
   renders as a "📖 See Fig. 7.4 in the textbook" chip pointing the reader
   to it.

LENGTH RULES
10. Card title: 3–8 words, drawn from or close to the source's own language,
    states the idea (not "Section 4.2").
11. Card body: 40–90 words, taken verbatim from the source. Hard ceiling 110.
    Markdown/HTML/mermaid syntax and `{{fig: ...}}` tags don't count toward
    the word limit. If a verbatim passage genuinely needs more room, split
    it into a second card at a natural sentence boundary rather than
    overflowing one.
12. Total cards should roughly track the source's own section count — a
    35-page chapter with ~20 headed sections should land somewhere around
    25–45 cards, not 300 and not 8. If your draft is wildly outside that
    range, reconsider your granularity before finalizing.

STRUCTURE RULES
13. Group related cards under the same section label where the source has
    clear headings (e.g. all cards from "Metastasis" share that label) — see
    output format below for where that label goes.
14. Order cards to match the source's own structure. Don't reorder for
    narrative effect.

SELF-CHECK BEFORE YOU OUTPUT
15. For every card, ask: "Is this exactly what the source said, or did I
    accidentally reword it?" If you rewrote anything, replace it with the
    actual original wording instead.
16. Confirm no card exceeds the body word ceiling.
17. Confirm every major heading in the source produced at least one card.
18. Confirm every table stayed a real Markdown table (not flattened to
    prose), every described diagram became a ```mermaid``` block, and every
    figure reference got its `{{fig: ...}}` tag.
```

---

## The output-format spec (paste this too)

Pick ONE of the two. Markdown is the default the reader expects.

### Markdown format

```
Output ONLY in this exact structure — no preamble, no commentary before or
after, just the deck itself:

# <Deck Title> - Short Excerpts

---

## SLIDE 1: <Card title>

<Card body, 40-90 words, verbatim from the source.>

---

## SLIDE 2: <Card title>

<Card body.>

---

(continue for every card)

---

## Skipped
(only include this final block if you deliberately omitted anything — one
line per item, with a one-sentence reason. Omit this whole section if nothing
was skipped.)
```

### JSON format (alternative)

```
Output ONLY a single JSON object, no markdown fences, no commentary:

{
  "title": "<Deck Title>",
  "cards": [
    {
      "idx": 1,
      "section": "<source heading this card belongs to>",
      "title": "<Card title>",
      "content": "<Card body, 40-90 words, verbatim from the source.>"
    }
  ]
}
```

---

## The actual prompt to send

Combine the two blocks above with your source text like this:

```
[paste CONTENT RULES block]

[paste the output-format spec you want — Markdown or JSON]

Here is the source document to convert:

---SOURCE START---
<paste your chapter / huge text here>
---SOURCE END---
```

If the source is too long for one pass (some model context windows will choke
on a 50-page chapter), split it section-by-section and run the prompt once per
section, using the SAME rules block every time so voice and length stay
consistent — then concatenate the outputs in order before loading into the
reader. Keep the deck title only on the first chunk's output and strip it from
the rest before merging.

---

## Sanity-checking the result

Before loading a generated deck into the reader:
- Skim 4–5 cards against the original source side by side. If any card
  doesn't match the source's actual wording, send it back rather than
  fixing it by hand — that usually means the rest of the deck has the same
  issue.
- Check the "Skipped" list (Markdown) or absence of obvious gaps (JSON) to
  confirm nothing important silently fell out.
- Check that any source table came through as a real Markdown table (not
  dumped into one paragraph), and that any diagram is a ```mermaid``` block
  rather than a prose description.
- Drop the file straight into the reader — it already parses both formats.
