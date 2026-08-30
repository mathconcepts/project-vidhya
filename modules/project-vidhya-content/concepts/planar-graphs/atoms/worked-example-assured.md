---
# Alternative body for planar-graphs.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: planar-graphs.worked-example.assured
concept_id: planar-graphs
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: planar-graphs-worked-example
for_stance: assured
---

$K_4$ ($V=4,E=6$): $E\leq3V-6=6$, bound met with equality, planar — confirmed by $V-E+F=4-6+4=2$ on the standard triangle-plus-center drawing:

```
        1
       /|\
      / | \
     2--+--3
      \ | /
       \|/
        4   (center vertex)
```

$K_5$ ($V=5,E=10$): $E\leq3V-6=9$ fails ($10>9$), so $K_5$ is non-planar — no drawing needs to be attempted. The underlying reason, if you want it: assuming planarity forces $F=7$ from Euler's formula, but $3F\leq2E$ (every face $\geq3$ edges, each edge on $\leq2$ faces) then demands $21\leq20$, false.

Where this costs marks: $E\leq3V-6$ is a fast necessary test, not a proof of planarity when satisfied — it only ever proves non-planarity, on the graphs that violate it. A graph satisfying the bound (like $K_{3,3}$, where $9\leq12$) can still be non-planar for a reason the bound can't see.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Euler's formula for K₄ and non-planarity of K₅","steps":[{"prompt":"For K₄ (V=4, E=6), what is the number of faces F in a planar drawing? Use Euler's formula to compute F.","hint":"Euler's formula: V - E + F = 2. Substitute V=4 and E=6 and solve for F.","answer":"V - E + F = 2 → 4 - 6 + F = 2 → F = 4. There are 4 faces: three inner triangular regions and one outer (infinite) face."},{"prompt":"Show that K₅ is non-planar using the inequality 3F ≤ 2E. If K₅ were planar, what would F be, and why does this give a contradiction?","hint":"First use Euler's formula to find F if K₅ were planar (V=5, E=10). Then check whether 3F ≤ 2E holds.","answer":"If planar: 5 - 10 + F = 2 → F = 7. Check: 3F = 21 but 2E = 20. Since 21 > 20, the inequality 3F ≤ 2E is violated — contradiction. K₅ cannot be planar."}]}
```
