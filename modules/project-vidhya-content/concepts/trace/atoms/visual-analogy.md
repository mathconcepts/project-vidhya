---
id: trace.visual_analogy
concept_id: trace
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
modality: visual
exam_ids: ["*"]
---

A matrix stretches space by different amounts along its own special directions. There are two different ways to combine those stretches, and mixing them up is the classic slip:

- **Multiply** them and you get the **determinant** — "how many times bigger did the box get?"
- **Add** them and you get the **trace** — "how much stretching is there in total?"

The bars on this card use the same matrix as the hook. It stretched one direction by 6 and the other by 3. Added, that is 9 — the trace, and exactly the diagonal sum 5 + 4. Multiplied, 6 times 3 is 18 — the determinant, a completely different number about a completely different question.

That addition is also why the order of a product does not matter to the trace: $\text{tr}(AB)$ and $\text{tr}(BA)$ both come out as the very same collection of products $a_{ij}b_{ji}$ added up, just gathered in a different order.

```gif-scene
{"type":"discrete-bars","values":[6,3,9],"labels":["x6","x3","sum 9"],"title":"Two stretch factors, added"}
```
