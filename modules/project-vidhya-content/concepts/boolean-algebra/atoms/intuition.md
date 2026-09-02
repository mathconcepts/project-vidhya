---
id: boolean-algebra.intuition
concept_id: boolean-algebra
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
modality: visual
---

Start from a guess: the simplified expression needs one term per minterm — five minterms, five terms. Test it against $F=\Sigma m(1,3,5,6,7)$ on variables $A,B,C$.

Write out the binary code for each: $1{=}001,3{=}011,5{=}101,6{=}110,7{=}111$. Four of the five ($1,3,5,7$) share $C=1$ — the last bit is $1$ in each. Group those four into a single term: $C$.

That leaves $6=110$ uncovered by $C$ alone (its last bit is $0$). Pair $6$ with $7=111$ — both have $A=1,B=1$: another single term, $AB$.

Five minterms, two terms: $F=C+AB$. The guess "one term per minterm" was wrong because minterms that differ in only one bit can merge — that's the entire mechanism behind Boolean minimization, and it's why grouping by shared bit-patterns beats writing five separate AND terms and simplifying algebraically afterward.
