---
# Alternative body for counting-principles.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: counting-principles.worked_example.assured
concept_id: counting-principles
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: counting-principles.worked-example
for_stance: assured
---

## The count, and why fixing first works

Fix the chairperson at seat 3 (1 way), then arrange the other 5 in the remaining 5 seats: $P(5,5)=5!=120$. Fixing an element first is a multiplicative shortcut — it turns $P(6,6)=720$ into $720/6=120$ directly, without building all 720 orderings.

## The one place this problem is ambiguous

"The middle seat" is well-defined only for an odd row. With 6 seats, "middle" plausibly means seat 3 or seat 4 — check the problem statement before committing to 120 alone. If either is allowed, the two cases are disjoint, so add: $120+120=240$.

## The generalizable move

Any "fix the constrained element, then permute the free ones" problem factors as (ways to place the constrained elements) $\times$ (permutations of the rest) — multiply, never add, unless combining genuinely separate cases like the ambiguous-middle one above.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Walk through: Committee seating with constraints",
  "steps": [
    {
      "prompt": "Step 1: A row of 6 seats is prepared. The chairperson must sit in the middle. How many seats are 'middle' seats?",
      "hint": "In a row of 6, the middle is position 3 (or 3.5 between 3 and 4). Typically, we choose one: either position 3 or position 4.",
      "answer": "1 (if strictly one middle position) or 2 (if either of the two center positions). For this problem, assume position 3."
    },
    {
      "prompt": "Step 2: The chairperson is now fixed in position 3. How many members remain to arrange in the other 5 positions?",
      "hint": "Start with 6 total members. Subtract the chairperson who is already placed.",
      "answer": "5 remaining members"
    },
    {
      "prompt": "Step 3: In how many ways can 5 members arrange themselves in 5 positions?",
      "hint": "This is a permutation problem: P(n, r) where we're arranging all 5 in all 5 positions.",
      "answer": "$P(5, 5) = 5! = 120$ ways"
    }
  ],
  "caption": "Key exam insight: Fixing a constrained element reduces permutation complexity. Always separate constraints from free choices."
}
```
