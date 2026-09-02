---
# Alternative body for boolean-algebra.intuition, stance `shaken`.
id: boolean-algebra.intuition.shaken
concept_id: boolean-algebra
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
modality: visual
variant_of: boolean-algebra.intuition
for_stance: shaken
---

Guess: five minterms need five terms in the answer. Check it.

Minterms of $F$: $1,3,5,6,7$. Write them in binary: $1{=}001, 3{=}011, 5{=}101, 6{=}110, 7{=}111$.

Look at $1,3,5,7$: every one ends in $1$ — that's $C=1$. Group them: one term, $C$.

Look at what's left: $6=110$. Pair it with $7=111$: both have $A=1,B=1$. Group them: one term, $AB$.

Five minterms, but only two terms: $F=C+AB$.

The guess was wrong — minterms differing in just one bit can share a single term.
