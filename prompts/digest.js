function buildPrompt(scrapedData, previousDigest = null) {
  const comparisonSection = previousDigest
    ? `## Last Week's Digest (for delta comparison)
${previousDigest}

## Rules
(The above headers are instructions only — do not echo them in your output.)

CRITICAL INSTRUCTION: You have last week's digest above. For each competitor, you MUST:
1. Compare this week's scraped data against what was already reported last week
2. Only surface genuinely NEW information not present in last week's digest
3. If nothing changed, say explicitly: "No new activity since last week's digest."
4. Do NOT repeat last week's signals, even if the scraped page still shows them
5. The goal is a DELTA report — what changed this week, not a full re-summary`
    : `Note: This is the first run — no previous digest to compare against. Report everything you find.`;

  return `IMPORTANT: Output ONLY the competitor sections. Do not add any title, header, or preamble before "## Testlio".

You are a senior competitive intelligence analyst

---

${comparisonSection}

---

## This Week's Scraped Data
${scrapedData}

---

## Output Format

Produce clean markdown EXACTLY as follows. No preamble, no explanation, just the digest.

## Testlio

**🆕 What's New**
- Bullet 1
- Bullet 2
(or "No new activity since last week's digest." if nothing changed)

**📡 Key Signal**
1-2 sentences. The "so what" — what does this tell us about their strategy? Not a summary, an insight.

**⚠️ Watch Out For**
1-2 sentences. Anything that could directly impact Qapitol? If nothing, say so in one line.

---

## QA Wolf

(same structure)

---

## Qualitest

(same structure)

---

## Infosys BPM

(same structure)

---

## Cigniti

(same structure)

---

## 🌐 Market Pulse

**Top Industry Themes This Week**
- Theme 1: one sentence insight
- Theme 2: one sentence insight
- Theme 3: one sentence insight

---

## Rules
- DELTA ONLY when previous digest exists. Do not repeat last week's content.
- Only use information from the scraped data. Do not hallucinate.
- Insight over summary. "They published a blog" is useless. "4 blogs on AI testing this week suggests imminent product launch" is useful.
- Key Signal and Watch Out must be plain text sentences — no bullet points.
- Be ruthlessly concise. If a section has no data, say so in one line.`;
}

module.exports = { buildPrompt };