---
id: planar-graphs-visual-analogy
concept_id: planar-graphs
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Planar Graphs as Road Maps (No Bridges Allowed)

## The Analogy

Picture 5 cities on a flat piece of land. A city planner wants to build a direct road between every pair of cities — but the land has no mountains, no tunnels, and no bridges. Every road must lie flat on the ground.

Can the planner succeed without any roads crossing?

**The answer is NO** — and this is exactly why $K_5$ (five cities, all pairs connected) is non-planar.

---

## The "Flat Map" Mental Model

```
Planar concept          Road-map equivalent
─────────────────────────────────────────────
Vertex                  City / junction
Edge                    Road segment
Planar embedding        Road map with no overpasses
Face                    Enclosed region (park, block, field)
Outer face              Everything outside the map boundary
Euler's formula         V - E + F = 2  (always, for connected maps)
```

---

## Euler's Formula Through the Map Lens

Imagine you start with just one city (1 vertex, 0 edges, 1 face — the whole plane).

- **Add a road to a new city** (new edge + new vertex, no new face): $V$ and $E$ both go up by 1 → $V - E + F$ unchanged.
- **Add a road between two existing cities** on the same map (new edge, splits one face into two): $E$ and $F$ both go up by 1 → $V - E + F$ unchanged.

Every legal construction leaves $V - E + F = 2$ intact. That is Euler's formula — the invariant of any connected planar map.

---

## Why $K_5$ Can't Be Drawn Flat

Five cities, 10 roads, no overpasses. Let us count faces using Euler's formula.

If it were planar: $V - E + F = 2 \Rightarrow 5 - 10 + F = 2 \Rightarrow F = 7$.

Every face of a simple graph needs at least 3 edges on its boundary, and each edge borders at most 2 faces, so:

$$3F \leq 2E \implies 3 \times 7 = 21 \leq 2 \times 10 = 20 \quad \text{CONTRADICTION}$$

No flat drawing exists. $K_5$ is non-planar — it needs an overpass (a crossing edge).

---

## $K_{3,3}$: The Utilities Puzzle

A classic puzzle: connect 3 houses to 3 utilities (gas, water, electricity) with no pipes crossing.

This is $K_{3,3}$ — 6 vertices, 9 edges. If it were planar:

$V - E + F = 2 \Rightarrow 6 - 9 + F = 2 \Rightarrow F = 5$

Since $K_{3,3}$ is bipartite (no triangles), every face has at least **4** edges on its boundary:

$$4F \leq 2E \implies 4 \times 5 = 20 \leq 2 \times 9 = 18 \quad \text{CONTRADICTION}$$

**The utilities puzzle has no solution on a flat plane.**

---

## The Key Intuition

Planar = you can lay the road network flat on a table with zero intersections.
Non-planar = at least one overpass is unavoidable.
The density bound $E \leq 3V - 6$ is the mathematical test for "too many roads for a flat map."
