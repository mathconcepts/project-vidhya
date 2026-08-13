---
id: shortest-paths-visual-analogy
concept_id: shortest-paths
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Shortest Paths as GPS Navigation

## The Analogy

Your smartphone's GPS must find the fastest route from your current location to every other city on the map. Road lengths are travel times in minutes.

This is exactly **Dijkstra's algorithm** — and GPS navigation software runs a close cousin of it millions of times a day.

---

## How the GPS Thinks (Dijkstra's Logic)

At every moment, the GPS maintains a **"best known time"** to reach each city. It works like this:

```
State: a set of SETTLED cities (shortest time confirmed)
       a priority queue of FRONTIER cities (candidates to explore next)

Rule:  Always explore the frontier city with the SMALLEST known time first.
       When you explore city U, update the times to all U's neighbors.
```

**Why smallest first?** Because road travel times are non-negative. Once you've confirmed the shortest time to city $U$, no future detour through other cities can improve it (all detours add time, never subtract).

---

## The GPS Step by Step

Suppose the map has 4 cities: Home (H), Airport (A), Mall (M), Station (S).

| Road | Travel time |
|---|---|
| H → A | 10 min |
| H → M | 30 min |
| A → M | 5 min |
| A → S | 15 min |
| M → S | 2 min |

**Start:** $d[H]=0$, all others $=\infty$. Settled = $\{\}$.

**Round 1:** Settle H (cheapest frontier = 0 min).
- Update A: $0 + 10 = 10$
- Update M: $0 + 30 = 30$

**Round 2:** Settle A (cheapest frontier = 10 min).
- Update M: $10 + 5 = 15 < 30$ → M improves to 15
- Update S: $10 + 15 = 25$

**Round 3:** Settle M (cheapest frontier = 15 min).
- Update S: $15 + 2 = 17 < 25$ → S improves to 17

**Round 4:** Settle S (cheapest frontier = 17 min). Done.

Final shortest times from H: A=10, M=15, S=17.

---

## Why Negative Weights Break GPS

Imagine a promotional road: "Take this road and you SAVE 20 minutes" (edge weight $= -20$). Now the GPS can no longer trust a settled city — it might revisit it later via the negative road and find a shorter path.

This is why **Dijkstra fails on negative weights**. For such maps you need **Bellman-Ford**, which patiently re-examines every road $V-1$ times to propagate all possible savings.

---

## Bellman-Ford: The Cautious Traveller

Bellman-Ford does not use a priority queue. Instead it repeats:

> "Check every single road in the network, and if any road can improve my current best time to some city, update it."

It does this $V - 1$ times. After $k$ passes, it has found all shortest paths that use at most $k$ roads. The extra $(V)$-th pass detects time-travel (negative cycles): if a city's time still improves, the path loops forever in a negative cycle.

---

## Floyd-Warshall: The Cartographer

Floyd-Warshall fills in a complete $V \times V$ distance table — shortest path between every pair of cities. Think of a printed road atlas showing the minimum driving time between every pair of cities.

Strategy: consider each city $k$ as a possible **waypoint**. For each pair $(i, j)$, ask: "Is going through $k$ faster than the currently known route?" Repeat for all $k$ in order.

This is $O(V^3)$ — acceptable for small $V$, impractical for GPS across millions of intersections.
