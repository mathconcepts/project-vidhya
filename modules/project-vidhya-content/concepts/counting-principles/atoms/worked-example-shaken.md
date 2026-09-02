---
# Alternative body for counting-principles.worked-example, served when the
# learner stance is `shaken`. See src/content/stance-variants.ts. Prose is
# held at or below the base atom's length; the arithmetic is written out
# in full rather than compressed.
id: counting-principles.worked-example.shaken
concept_id: counting-principles
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: counting-principles.worked-example
for_stance: shaken
---

**Problem.** 5 women, 4 men. Choose a team of 4. How many teams have at least 2 women?

---

**Step 1 — List what "at least 2" excludes.** Teams with 0 women or 1 woman — only 2 cases. Count these instead, then subtract from the total.

---

**Step 2 — Total teams from 9 people.** $C(9,4) = \dfrac{9\times8\times7\times6}{4\times3\times2\times1} = \dfrac{3024}{24} = 126$.

---

**Step 3 — 0-women teams.** All 4 from the 4 men: $C(4,4)=1$.

---

**Step 4 — 1-woman teams.** 1 of 5 women times 3 of 4 men: $C(5,1)\times C(4,3) = 5\times4=20$.

---

**Step 5 — Subtract.** $126 - 1 - 20 = \boxed{105}$.

**Check.** Count the 3 allowed cases directly: 2 women ($C(5,2)C(4,2)=10\times6=60$), 3 women ($C(5,3)C(4,1)=10\times4=40$), 4 women ($C(5,4)=5$). $60+40+5=105$ — matches the direct count.
