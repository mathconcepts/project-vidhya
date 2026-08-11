# Implicit Differentiation
> GATE Engineering Mathematics | Calculus | medium frequency | difficulty: 0.5

## Intuition First
When y is tangled with x in an equation (like a circle x²+y²=25), you differentiate both sides treating y as a hidden function of x — like peeling both layers of a sandwich at once.

## Core Definition
**Implicit Differentiation**: Given F(x,y)=0, differentiate both sides with respect to x, applying the chain rule to every y-term: d/dx[f(y)] = f'(y)·dy/dx.

## What Happens (Worked Example)
**What happens:** Find dy/dx for x²+y²=25.

Differentiate both sides w.r.t. x:

2x + 2y·(dy/dx) = 0

2y·(dy/dx) = -2x

dy/dx = -x/y

**Why it works:** y is a function of x, so by chain rule d/dx[y²] = 2y·(dy/dx). The equation implicitly defines y(x) without isolating it first.

## GATE MA Relevance
> **Why it matters in GATE MA:** Appears in 1–2 mark MCQs asking for dy/dx or d²y/dx² of implicit curves; also foundational for related rates and partial derivatives.
