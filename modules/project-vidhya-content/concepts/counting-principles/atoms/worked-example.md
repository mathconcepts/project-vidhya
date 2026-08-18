---
id: counting-principles.worked-example
concept_id: counting-principles
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

# Worked Example: Seating Arrangement Problem

## Problem (GATE-style)

A committee of 6 members wants to arrange themselves in a row for a photograph. However, the chairperson must sit in the middle (position 3 or 4, depending on numbering). How many valid arrangements are possible?

---

## Step-by-Step Solution

**Step 1: Identify the constraint**
The chairperson must occupy the middle seat. In a row of 6, the "middle" is position 3 (using 1-indexing) or position 4 (using 0-indexing). Let's use position 3.

**Step 2: Fix the chairperson's position**
Place the chairperson in position 3. This leaves 5 remaining members to arrange in the other 5 positions.

**Step 3: Count arrangements of remaining members**
The 5 remaining members can be arranged in the 5 remaining positions in $P(5,5) = 5! = 120$ ways.

**Step 4: Final answer**
Total valid arrangements = $1 \times 5! = 120$ ways.

**Why this works:** By fixing one element (the chairperson), we reduced the permutation from $P(6,6) = 720$ to $P(5,5) = 120$. This is a core exam trick: **constraints reduce the problem space**.

---

## Alternative Interpretation (If "middle" means either position 3 or 4)

If the chairperson can sit in position 3 OR position 4:
- Arrangements with chairperson in position 3: $5! = 120$
- Arrangements with chairperson in position 4: $5! = 120$
- **Total:** $120 + 120 = 240$ ways

---

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

---

## Quick Exam Checklist

✓ Identify constraints (fixed elements)  
✓ Separate constrained from free positions  
✓ Apply permutation formula to the free part  
✓ Multiply if there are multiple independent constraint cases
