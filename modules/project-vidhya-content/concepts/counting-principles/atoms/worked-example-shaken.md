---
# Alternative body for counting-principles.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: counting-principles.worked_example.shaken
concept_id: counting-principles
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: counting-principles.worked-example
for_stance: shaken
---

## Identify the setup

6 seats in a row. One rule: the chairperson must sit in the exact middle seat, position 3. Nothing else is constrained yet.

## Fill the fixed seat, then the rest

Seat 3: the chairperson, in 1 way. The other 5 people fill the remaining 5 seats in a row, so order matters: $5!=5\times4\times3\times2\times1=120$ ways.

## Check it

With no constraint at all, 6 people in 6 seats give $6!=720$ arrangements. Fixing one specific person into one specific seat should shrink that by a factor of 6: $720/6=120$. Matches the direct count.

## If "middle" allows seat 3 or seat 4

Repeat the same steps for seat 4: another 120 ways. The chairperson can't sit in both seats at once, so the two cases don't overlap — add them: $120+120=240$.

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
