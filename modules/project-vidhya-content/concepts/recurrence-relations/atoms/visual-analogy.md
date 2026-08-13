---
id: recurrence-relations.visual-analogy
concept_id: recurrence-relations
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
scaffold_fade: true
---

# The Climbing Hiker: Building Your Sequence Step by Step

Picture a hiker climbing a mountain trail where each new altitude is determined by how high they've already climbed:

**The Rule:** Each day's elevation gain depends on the previous day's altitude — say, "climb 50% higher than yesterday, plus a fixed 100m push."

$$a_n = 1.5 \cdot a_{n-1} + 100$$

- Day 1 (start): 500m (initial condition)
- Day 2: $1.5(500) + 100 = 850$m
- Day 3: $1.5(850) + 100 = 1375$m
- Day $n$: predicted directly without recomputing every step

The power: you don't climb day-by-day each time; you jump straight to day 30 using a formula. That's solving the recurrence.

```gif-scene
{
  "type": "sequence-build",
  "values": [500, 850, 1375, 2162.5, 3343.75],
  "formula": "a_n = 1.5*a_{n-1} + 100",
  "labels": ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"]
}
```
```

---

## **ATOM 3: Worked Example**
**File:**
