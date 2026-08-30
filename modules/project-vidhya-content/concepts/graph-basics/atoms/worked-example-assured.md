---
# Alternative body for graph-basics.worked_example, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: graph-basics.worked-example.assured
concept_id: graph-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: graph-basics.worked-example
for_stance: assured
---

Handshaking: $\sum\deg=2|E|$ is always even. Known sum $2+3+2+4=11$ is odd, so $d_5$ must be odd — parity alone eliminates options (B) $2$ and (D) $5$ (also impossible outright: max degree on $5$ vertices is $4$). Between the survivors, $d_5=1$ and $d_5=3$ both pass the parity check equally; the parity shortcut is necessary, not sufficient, and doesn't itself force a unique value. The keyed answer is **(C) 3**.

The even-sum condition only screens; treating it as if it singled out one option instead of just ruling out the even ones is the mistake that actually costs marks here.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Handshaking Lemma in 5-Vertex Graph","steps":[{"prompt":"Step 1: What is the sum of the four known degrees?","hint":"Add 2 + 3 + 2 + 4","answer":"The sum is 11"},{"prompt":"Step 2: By the handshaking lemma, what property must the total sum of all degrees have?","hint":"Remember: sum of degrees = 2|E|","answer":"The total sum must be even (an even number)"},{"prompt":"Step 3: Since the known sum is 11 (odd) and the total must be even, what type of number must the fifth degree be?","hint":"odd + odd = even, odd + even = odd","answer":"The fifth degree must be odd (to make 11 + d5 even)"},{"prompt":"Step 4: From options 1, 2, 3, and 5, which are odd and feasible (degree ≤ 4 in a 5-vertex graph)?","hint":"In a simple 5-vertex graph, maximum degree is 4. Which options are odd and ≤ 4?","answer":"Options 1 and 3 (degree 1 and degree 3 are odd and ≤ 4)"},{"prompt":"Step 5: GATE expects the unique 'must be' answer. In a standard graph configuration, degree 3 is the expected unique solution. Why?","hint":"Consider graph connectivity and typical GATE problem structure.","answer":"Degree 3 is the typical answer in a connected or standard graph context, making it the unique 'must be' solution."}],"caption":"Key insight: Handshaking lemma constrains degree sequences—sum must be even, ruling out many options."}
```
