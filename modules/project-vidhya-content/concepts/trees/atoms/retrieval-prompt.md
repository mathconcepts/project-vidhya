---
id: trees.retrieval-prompt
concept_id: trees
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

A tree has exactly 4 leaves (degree-1 vertices). What is the minimum number of vertices that must have degree at least 3?

- **(A)** 0
- **(B)** 1
- **(C)** 2
- **(D)** 3

<details>
<summary>Answer</summary>

**C**. In a tree $T = (V, E)$ with $|V| = n$ and $|E| = n - 1$:
Handshaking Lemma: $\sum_{v} \deg(v) = 2(n-1) = 2n - 2$.

Let:
- $L$ = number of leaves (degree 1) = 4
- $D_2$ = number of degree-2 vertices
- $D_{\geq 3}$ = number of vertices with degree $\geq 3$

We have:
$|V| = 4 + D_2 + D_{\geq 3} = n$
$\sum \deg(v) = 4(1) + D_2(2) + (\text{sum of degrees} \geq 3D_{\geq 3}) = 2n - 2$

To minimize $D_{\geq 3}$, set all degree-$\geq 3$ vertices to exactly degree 3.
$4 + 2D_2 + 3D_{\geq 3} = 2n - 2$
$4 + 2D_2 + 3D_{\geq 3} = 2(4 + D_2 + D_{\geq 3}) - 2$
$4 + 2D_2 + 3D_{\geq 3} = 8 + 2D_2 + 2D_{\geq 3} - 2$
$4 + 2D_2 + 3D_{\geq 3} = 6 + 2D_2 + 2D_{\geq 3}$
$3D_{\geq 3} = 2 + 2D_{\geq 3}$
$D_{\geq 3} = 2$

So at least 2 vertices must have degree $\geq 3$. This is achieved when: $n = 4 + D_2 + 2$, so $n = 6 + D_2$. For example, if $D_2 = 0$, then $n = 6$ vertices: 4 leaves + 2 internal degree-3 vertices, arranged as a tree where each degree-3 vertex connects to 2 leaves and the other degree-3 vertex (or similar structure).

</details>
