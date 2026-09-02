---
id: ode-higher-order.exam-pattern
concept_id: ode-higher-order
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions give an IVP with $n$ conditions and ask for $y$ at a point**, requiring: factor the auxiliary polynomial fully, build the general solution term by term, solve the resulting $n\times n$ linear system for the constants, then evaluate. For $y'''-6y''+11y'-6y=0$ with $y(0)=3,y'(0)=6,y''(0)=14$, the answer $y=e^x+e^{2x}+e^{3x}$ at $x=\ln2$ gives $y=2+4+8=14$ — an integer result is a good sign the factoring and the linear system were both handled correctly.

- **MCQ questions ask you to match an auxiliary polynomial (already factored, or given as roots) to its solution family**, with distractors that use the wrong multiplicity treatment (missing an $x$-power) or the wrong root count for the stated order.

- **MSQ "which are true" questions probe general structure**, e.g. "an $n$-th order linear homogeneous ODE's solution space has dimension exactly $n$" (true) or "a repeated root contributes as many independent solutions as its multiplicity" (true) versus "any $n$ solutions of an $n$-th order equation form a valid general solution" (false — they must be linearly independent).

- **Time budget:** factoring a degree-$3$ polynomial (one inspection root plus a quadratic) takes under a minute; a degree-$4$ or higher polynomial, or one requiring two inspection roots, should be budgeted closer to two minutes.
