---
# for_stance: assured — the one distinction that costs marks: why a repeated root can't be treated like two identical exponentials.
id: ode-second-order-homo.intuition.assured
concept_id: ode-second-order-homo
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: ode-second-order-homo.intuition
for_stance: assured
---

The one case that breaks the naive pattern is a repeated root. When $b^2-4ac=0$, the characteristic equation yields a single $r$, and a tempting-but-wrong move is writing $y=C_1e^{rx}+C_2e^{rx}$ — that collapses to $(C_1+C_2)e^{rx}$, a one-parameter family, unable to satisfy two independent initial conditions. The genuine second solution is $xe^{rx}$, and it isn't a guess: because $r$ is a double root, both $ar^2+br+c=0$ and its derivative $2ar+b=0$ hold simultaneously, and substituting $y=xe^{rx}$ into $ay''+by'+cy$ reduces to exactly those two identities cancelling to zero. Two distinct real roots or a complex pair never need this fix — only equal roots do.
