---
id: graph-basics.visual-analogy
concept_id: graph-basics
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
scaffold_fade: true
---

## Airport Network Analogy

Imagine a network of airports across India. Each **airport is a vertex**, and each **flight route between two airports is an edge**. The **degree** of an airport is how many direct flight routes connect it — a hub like Delhi has high degree, while a small regional airport has low degree.

Now, if you count the total number of flight routes by summing the degree of every airport, you count each route twice (once for each endpoint). This is exactly the **handshaking lemma**: the sum of degrees equals twice the number of routes.

In GATE graph problems, vertices might be cities, computers, or gate inputs — but the underlying structure is always this: points connected by relationships. The handshaking lemma is your guarantee that the count is consistent no matter how you look at it.

```gif-scene
{
  "type": "parametric",
  "x_expr": "(t - 0.5) * 6",
  "y_expr": "0.3 * sin(3 * (t - 0.5))",
  "t_range": [0, 1],
  "title": "Graph Structure",
  "width": 400,
  "height": 300
}
```

---

## File 3:
