---
id: differentiability.intuition
concept_id: differentiability
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

# Differentiability: When a Function is "Smooth Enough"

Differentiability is about whether a function is **smooth enough to have a tangent line** at every point in an interval. While continuity asks "can you draw the curve without lifting your pen?", differentiability asks "can you draw a straight line that just touches the curve at each point?"

## The Key Insight

A function is **differentiable at a point** if:
1. It is continuous at that point (no jumps or gaps)
2. It has a well-defined slope (derivative) at that point

The crucial difference: **continuity doesn't guarantee differentiability**. A continuous function can still have a sharp corner or cusp where the slope changes abruptly.

## Sharp Corners vs. Smooth Curves

- **Smooth curve** (like $y = x^2$): The slope changes gradually. No matter how close you zoom in, the curve looks like a nearly straight line. This is differentiable.
- **Sharp corner** (like $y = |x|$): At the corner (x = 0), the slope jumps from −1 to +1 instantly. The function is continuous but NOT differentiable there.

## Why This Matters for GATE

In GATE, differentiability questions often appear when dealing with **piecewise-defined functions**. The tricky part is at the junction points where the formula changes. You must check:
- Do the pieces connect without a gap? (Continuity)
- Do the pieces have the same slope as you approach from both sides? (Differentiability)

If either fails, the function is not differentiable at that point.
```

---

## ATOM 2: Visual Analogy

**File path:**
