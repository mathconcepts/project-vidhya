---
id: sequences-series.mnemonic
concept_id: sequences-series
atom_type: mnemonic
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
modality: mnemonic
---

**"Add, Multiply, Flip."** AP: **add** the common difference each step. GP: **multiply** by the common ratio each step. HP: **flip** every term (take reciprocals) and check whether THAT sequence is an AP.

**"Always Greater, Always Smaller."** In AM-GM-HM, alphabetical order is also size order: **A**M is **A**lways the biggest, **H**M is always the smallest, GM sits in between. One phrase, no formula needed to recall which mean wins.

**Telescoping: a falling line of dominoes.** Every middle domino both gets knocked down by the one before it AND knocks down the one after it — it cancels itself out of the story. Only the very FIRST domino (nothing knocked it down) and the very LAST domino (it knocked nothing down after it) are left standing at the end. That is exactly which two terms survive a telescoping sum.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag a and b — watch AM, GM, HM stay in the same order, every time",
  "why": "AM, GM and HM are three different numbers built from the same a and b — drag either one and watch that AM never drops below GM, and GM never drops below HM, no matter what you pick.",
  "inputs": [
    {"id": "a", "label": "a", "min": 1, "max": 20, "step": 1, "initial": 4},
    {"id": "b", "label": "b", "min": 1, "max": 20, "step": 1, "initial": 16}
  ],
  "outputs": [
    {"label": "AM = (a+b)/2", "formula": "(a + b) / 2", "digits": 2},
    {"label": "GM = sqrt(ab)", "formula": "sqrt(a * b)", "digits": 2},
    {"label": "HM = 2ab/(a+b)", "formula": "2 * a * b / (a + b)", "digits": 2}
  ],
  "caption": "Start at a=4, b=16 — the intuition card's own example — and check AM=10, GM=8, HM=6.4. Now drag a and b closer together, then far apart again. AM stays on top and HM stays on the bottom the whole time; only when a equals b do all three meet at the same value."
}
```
