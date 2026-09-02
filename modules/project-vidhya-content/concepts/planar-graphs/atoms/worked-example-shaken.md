---
# Alternative body for planar-graphs.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: planar-graphs.worked-example.shaken
concept_id: planar-graphs
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: planar-graphs.worked-example
for_stance: shaken
---

**Setup — Part A.** $K_4$: $V=4$, $E=6$.

**Step 1 — draw without crossings.** One vertex in the center, joined to the other three, which form an outer triangle. All $6$ edges present, no crossing.

```
        1
       /|\
      / | \
     2--+--3
      \ | /
       \|/
        4   (center vertex)
```

**Step 2 — count faces.** $3$ inner triangular regions plus $1$ outer region: $F=4$.

**Step 3 — check Euler's formula.** $V-E+F=4-6+4=2$. Holds.

**Setup — Part B.** $K_5$: $V=5$, $E=10$. Show it is non-planar.

**Step 4 — assume it is planar and apply Euler's formula.** $5-10+F=2 \Rightarrow F=7$.

**Step 5 — apply the face–edge inequality.** Every face boundary uses at least $3$ edges, and each edge borders at most $2$ faces, so $3F\leq 2E$.

**Step 6 — substitute and check.** $3\times7=21$ against $2\times10=20$. $21\leq20$ is false.

**Conclusion.** The assumption that $K_5$ is planar leads to a contradiction, so $K_5$ is non-planar.

**Watch this trap.** Drawing $K_5$ and getting exactly one crossing doesn't mean a cleverer drawing could remove it — Steps 4 through 6 form an algebraic proof that no drawing, however clever, avoids a crossing.

**Hold onto this.** $E\leq 3V-6$ (combining Step 5 with Euler's formula) is the fast necessary check; $K_5$ fails it outright ($10>3(5)-6=9$), the shortcut version of the contradiction just derived by hand.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Euler's formula for K₄ and non-planarity of K₅","steps":[{"prompt":"For K₄ (V=4, E=6), what is the number of faces F in a planar drawing? Use Euler's formula to compute F.","hint":"Euler's formula: V - E + F = 2. Substitute V=4 and E=6 and solve for F.","answer":"V - E + F = 2 → 4 - 6 + F = 2 → F = 4. There are 4 faces: three inner triangular regions and one outer (infinite) face."},{"prompt":"Show that K₅ is non-planar using the inequality 3F ≤ 2E. If K₅ were planar, what would F be, and why does this give a contradiction?","hint":"First use Euler's formula to find F if K₅ were planar (V=5, E=10). Then check whether 3F ≤ 2E holds.","answer":"If planar: 5 - 10 + F = 2 → F = 7. Check: 3F = 21 but 2E = 20. Since 21 > 20, the inequality 3F ≤ 2E is violated — contradiction. K₅ cannot be planar."}]}
```
