---
id: binomial-theorem.visual-analogy
concept_id: binomial-theorem
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
modality: visual
---

Think of Pascal's triangle as a family tree of the binomial coefficients: each row is one value of $n$, and each entry $\binom{n}{r}$ is built by adding the two entries just above it in the previous row. The bars on this card are one full row, $n=6$: $1, 6, 15, 20, 15, 6, 1$ — the seven coefficients of $(a+b)^6$, in order from $r=0$ to $r=6$.

Two facts jump out from just looking at the bar heights. First, the row is perfectly symmetric — the bar at position $r$ always matches the bar at position $6-r$, which is exactly the identity $\binom{n}{r}=\binom{n}{n-r}$ drawn as a mirror image. Second, the tallest bar sits dead centre at $r=3$, height $20$ — the single greatest coefficient for this even value of $n$, at $\binom{6}{3}$. Neither fact needs a formula to see; both are visible the moment the row is drawn as bars instead of a list of numbers.

```gif-scene
{"type":"discrete-bars","values":[1,6,15,20,15,6,1],"labels":["C(6,0)","C(6,1)","C(6,2)","C(6,3)","C(6,4)","C(6,5)","C(6,6)"],"title":"Row n=6 of Pascal's Triangle","frames":1,"fps":1}
```
