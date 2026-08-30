---
id: graph-basics.worked-example
concept_id: graph-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

## GATE Problem: Degree Sequence Consistency

**Problem:**

A simple undirected graph has 5 vertices and 7 edges. Four of its vertices have degrees 2, 3, 2 and 4. What is the degree of the fifth vertex?

(A) 1
(B) 2
(C) 3
(D) 5

---

## Solution

By the **handshaking lemma**, the degrees sum to $2|E|$.

$$\sum_{i=1}^{5} d_i = 2|E| = 2(7) = 14$$

Sum of the four known degrees: $2 + 3 + 2 + 4 = 11$.

$$11 + d_5 = 14 \quad\Longrightarrow\quad d_5 = 3$$

**Answer: (C) 3**

---

## Why the edge count is in the question

Parity alone would not have finished this. Without $|E|$, all you get from the handshaking lemma is that $11 + d_5$ is even, so $d_5$ is odd — which leaves both (A) 1 and (C) 3 standing, and both are genuinely realisable:

- $d_5 = 1$ gives degree sum 12, so $|E| = 6$
- $d_5 = 3$ gives degree sum 14, so $|E| = 7$

Run Havel–Hakimi on either and you get a real graph. A question that stopped at parity would have two correct answers.

So parity is a **filter**, not a solver. It kills (B) 2 outright — even, wrong parity — and (D) 5 is dead for a separate reason worth keeping distinct: in a simple graph on 5 vertices no vertex can exceed degree 4, since it has only 4 possible neighbours and no repeated edges or self-loops.

Two independent constraints, two different eliminations. Reach for the degree bound when parity leaves more than one option alive.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Handshaking Lemma in 5-Vertex Graph","steps":[{"prompt":"Step 1: The graph has 7 edges. What must the five degrees sum to?","hint":"The handshaking lemma: the degrees sum to 2|E|, because every edge contributes 1 to each of its two endpoints.","answer":"2(7) = 14"},{"prompt":"Step 2: What do the four known degrees add up to?","hint":"Add 2 + 3 + 2 + 4.","answer":"11"},{"prompt":"Step 3: Find the fifth degree.","hint":"Subtract the known sum from the total: d5 = 14 - 11.","answer":"d5 = 3, which is option (C)"},{"prompt":"Step 4: Suppose the edge count had been left out. What would the handshaking lemma alone tell you?","hint":"11 is odd, and the total must be even. odd + odd = even.","answer":"Only that d5 is odd. That leaves both (A) 1 and (C) 3 alive, and both are genuinely realisable graphs -- parity narrows the field without picking a winner."},{"prompt":"Step 5: Options (B) 2 and (D) 5 are both impossible, but for different reasons. Name each.","hint":"One fails the parity test. The other fails a bound that has nothing to do with parity.","answer":"(B) 2 is even, so 11 + 2 = 13 is odd and cannot equal 2|E|. (D) 5 exceeds the maximum degree in a simple graph on 5 vertices, which is 4 -- a vertex has only 4 other vertices available and cannot repeat an edge or loop to itself."}],"caption":"Parity filters the candidates; the edge count or the degree bound is what finally picks one."}
```
