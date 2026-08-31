# Wow mechanics for the concepts a 2×2 linear map can't honestly show

**Date:** 2026-08-31
**Lane:** Design (parallel to the `linear_map` rollout — see
`rollout-brief.md` for that lane's exemplar/renderer study and its verified
matrix menu). This doc does not touch that lane's files.
**Builds on:** `docs/designs/2026-08-30-resonance-fused-atoms-plan.md` (the
resonance design contract — beats, trap, motion tokens, autoplay,
reduced-motion storyboard) and the eigenvalues `linear_map` exemplar
(`frontend/src/components/lesson/interactives/types.ts`,
`Simulation.tsx`).
**Status:** PROPOSAL — no implementation in this pass.

---

## 0. Scope and method

Nine concepts, assigned because none of them is "a 2×2 matrix acting on the
whole plane," which is the one thing `linear_map` mode was built to show:

- 7 concepts to design fresh: `cayley-hamilton`, `gram-schmidt`,
  `inner-product-spaces`, `trace`, `systems-of-equations`, `limits`,
  `derivatives-basic`.
- 2 pass-overs to revisit: `vector-spaces`, `lu-factorization`.

Seven of the nine already carry a fenced `interactive-spec` block on
`hook.md` (parametric-trace mode, from the earlier resonance authoring
pass) — only `vector-spaces` and `lu-factorization` are still prose-only.
So this is not a from-scratch design exercise for most of these; it is a
review: **is the mechanic already used the honest best one, or is there a
better wow within reach** — preferring, in that order, (1) the scene the
concept already has, reauthored; (2) the existing `parametric` or
`linear_map` mode, used differently; (3) a small additive extension; (4) a
genuinely new mode.

Renderer capabilities as of this pass (from `types.ts` / `Simulation.tsx`):
a scene draws **one** parametric trace `(x(t),y(t))` with a moving head, OR
**one** `linear_map` field of arrows morphing through a single 2×2 matrix
`M(s)=I+s(A−I)`; either can carry an optional dashed grey `ghost`
(expression-based or `ghost_matrix`); beats attach text/emphasis/one trap
to progress points. The safe formula evaluator has `+ − × ÷ ^`, parens, and
`sin/cos/tan/sqrt/abs/log/exp/min/max/pow` — no conditionals, so a
"piecewise" motion has to be built from `min`/`max` clamps, and division is
available, which matters below (§5). There is no way today to draw two
independent points with a connecting segment, or anything beyond 2
dimensions — both come up as "what NOT to build" in §8.

---

## 1. Mechanic inventory (what this doc actually proposes)

| # | Mechanic | New code? | Concepts it covers here |
|---|---|---|---|
| A | `parametric` mode, reauthored or confirmed as-is | No | gram-schmidt (content-only trap swap), inner-product-spaces (confirm), systems-of-equations (reauthor), limits (confirm), derivatives-basic (confirm) |
| B | `linear_map` mode, used in place of an existing parametric scene | No | trace |
| C | **NEW additive:** two-stage matrix morph (`stages: Mat2[]` on `LinearMapSceneSpec`) | Yes — small | cayley-hamilton, lu-factorization |

That's **one** new mechanic, covering the two concepts whose entire "wow"
depends on composing two matrix actions — everything else is a content
change or a mode swap, zero renderer work. This is deliberately narrower
than the rollout brief's speculative 4-concept span for a two-stage morph
(cayley-hamilton + gram-schmidt + lu-factorization + matrix-inverse-roundtrip)
— see §3.2 for why gram-schmidt doesn't belong in that group, and the note
below for matrix-inverse-roundtrip.

**Why matrix-inverse-roundtrip is not in this doc's grouping either — a
scope boundary, not a rejection.** Mathematically it is a clean Mechanic C
fit: stage 1 = `A`, stage 2 = `A⁻¹`, cumulative = `I` — every intermediate
`s` is honestly linear, and the arrows visibly walking back to where they
started is exactly the "inverse undoes the matrix" surprise. But
`matrix-inverse` is a concept a 2×2 linear map CAN honestly show — it is
already on the parallel `linear_map` rollout's own verified matrix menu
(`A=[[3,1],[1,1]]`, `ghost_matrix=[[2,1],[4,2]]`, det-0 story), which is
that lane's file to author, not this one's (§0's charter is the concepts a
single 2×2 map *cannot* show; matrix-inverse fails that filter). Recorded
here as a real, worked-out follow-up for whoever authors matrix-inverse's
content once Mechanic C ships — not folded into this doc's build order or
grouping table, and no file under that concept is touched by this pass.

### 1.1 Mechanic C spec — two-stage matrix morph (additive, `v:1`)

```jsonc
// LinearMapSceneSpec, additive fields — a spec with no `stages` renders
// exactly as today.
{
  "matrix": [[2,3],[4,7]],       // REQUIRED when stages present: the FINAL
                                  // cumulative matrix — stages[n-1]·…·stages[0].
                                  // Validator matrix-multiplies stages and
                                  // refuses if the product ≠ matrix (same
                                  // "re-verify, don't trust" discipline as
                                  // `eigen`'s residual check).
  "stages": [[[2,3],[0,1]], [[1,0],[2,1]]],   // U then L, applied in order
  "stage_labels": ["apply U", "apply L"]       // length === stages.length
}
```

**Playback:** the existing morph window `[MORPH_START_PROGRESS,
MORPH_END_PROGRESS]` (0.15–0.72) splits into `stages.length` equal
sub-windows. Sub-window *k* interpolates the cumulative product of
`stages[0..k-1]` to the cumulative product of `stages[0..k]`, using the
same entrywise-affine `M(s) = M_{k-1} + s·(M_k − M_{k-1})` the single-stage
morph already uses (generalized from `I + s·(A−I)`) — every intermediate
`s` is still a genuine linear map, so nothing about the honesty guarantee
changes. `eigen`/`ghost_matrix`, if declared, check against the **final**
cumulative `matrix` only — no per-stage eigen claims, to keep the
extension minimal.

**Rendered as:** the same arrow field as today, plus a short label
crossfade at each stage boundary (`stage_labels[k]`) and a brief settle
(reuse `DUR_SLOW_S`, the existing trap-hold duration constant) before the
next stage starts, so two chained morphs don't read as one continuous blur.

**What it must NOT claim:** it is a chained sequence of two *linear* maps,
not a claim that *any* two-step procedure can be drawn this way — LU
factors, and `A²` (apply `A` twice), both are honestly linear at every
step. A scene must not use `stages` for anything where an intermediate
step isn't itself a linear map (ruled out below for gram-schmidt).

---

## 2. Design contract constraints (binding on every recommendation below)

Ink (`#1d1d1f`) / separator hairline / grey (`var(--grey-6)`) for chrome and
ghosts; green only for the payoff reveal. ≤8 beats. At most one trap beat,
third-person register, sourced from the concept's own `common-traps.md`
entry (named below). Autoplay once on mount; reduced motion renders the
full storyboard, zero motion. Equal-scale geometry wherever an angle or a
"did it turn" claim carries meaning (the existing `linear_map` mode already
enforces this via `linearMapViewBox`; any parametric scene with an
angle claim must set its own square-ish `view_box` by hand — flagged where
it applies below).

---

## 3. Per-concept recommendations

### 3.1 cayley-hamilton

1. **Surprise:** a matrix obeys its *own* polynomial — build `p(λ)` from
   `A`'s eigenvalues, then feed `A` itself into `p`, and the answer is
   exactly zero, watched live by applying `A` twice and comparing to
   `3A − 2I`.
2. **Mechanic:** Mechanic C (two-stage morph), stage 1 = `A`, cumulative
   final = `A²`. Reuses the concept's own already-verified matrix
   `A=[[1,1],[0,2]]` (char. poly `λ²−3λ+2`, eigen `(1,0)→1`,
   `(1,1)→2`) — no new matrix to source. `A² = [[1,3],[0,4]]` (hand-checked:
   `A·A`; also `3A−2I = [[3,3],[0,6]]−[[2,0],[0,2]] = [[1,3],[0,4]]`,
   matches). Eigen of the final `A²`: `(1,0)→1`, `(1,1)→4` — the *squares*
   of `A`'s own eigenvalues, which is the beat that lands the theorem.
3. **Trap:** already correctly authored in the existing hook — "Students
   think Cayley-Hamilton means substituting `A` into `det(A−λI)=0`
   itself…", sourced from common-traps.md's *"Confusing the relation"*
   bullet. Keep the same trap beat placed on stage 1 (it doesn't depend on
   which stage is active); stage 2 adds the payoff beats after it, no
   second trap.
4. **Honest-math constraints:** one morph shows `A` acting once — it
   cannot show `A²` without a second stage, which is exactly why this is
   Mechanic C's flagship case, not a candidate for staying single-stage.
   The final reveal beat states the numeric check (`λ²=3λ−2` for the
   *original* eigenvalues `1,2`: `1²=3·1−2=1` ✓, `2²=3·2−2=4` ✓) in prose
   next to the arrows — the visual proves the eigen-direction case; the
   general-vector case (true Cayley-Hamilton) stays a prose sentence,
   stated as such, never implied by the arrows alone.
5. **Effort:** M (needs Mechanic C built first; content authoring on top of
   an existing, already-verified matrix is cheap once the renderer exists).

### 3.2 gram-schmidt

1. **Surprise:** subtracting a vector's shadow on what's already fixed,
   then normalizing, turns three lopsided vectors into a perpendicular set
   spanning the exact same space.
2. **Mechanic:** Mechanic A — the **existing** `parametric` scene is
   already the right choice and does not need Mechanic C. Gram-Schmidt
   modifies **one vector at a time**, not the whole plane — projecting off
   `e1` is technically a linear map (`I−P_{e1}`) and could in principle be
   staged, but doing so would draw every arrow in the plane collapsing
   toward a line, which dramatizes a fact irrelevant to what a student is
   actually tracking (one vector's journey to orthonormal). Keep the
   existing "one point sliding" scene.
3. **Trap — REASSIGN.** The current hook's trap describes the *3-vector*
   case ("forgetting to also subtract the projection onto `e2`"), sourced
   from common-traps.md's *"Trap 2: Forgetting to subtract all previous
   projections."* A 2-vector, 2D scene cannot honestly show that trap —
   there is no second prior vector to omit in this example, so the trap
   beat currently describes something that never appears on screen.
   Recommend swapping to *"Trap 1: Normalizing before orthogonalization"*
   — projecting `v2` onto `e1` (the *normalized* first vector, not raw
   `v1`) is exactly what the existing scene's second beat already computes
   (`⟨v2,e1⟩=1` because `e1` is unit length) — the trap is already sitting
   in the visualized math, it just needs the trap label moved onto it.
4. **Honest-math constraints:** a 2D SVG cannot show a 3-vector
   orthogonalization at all, so Trap 2 (the multi-projection omission)
   stays prose-only in `common-traps.md` forever, not a gap this design
   closes — flagged explicitly rather than silently left.
5. **Effort:** S — content-only edit (retarget the trap, adjust
   `text_assured` if it references the trap being replaced), zero renderer
   change.

### 3.3 inner-product-spaces

1. **Surprise:** Cauchy–Schwarz equality (`|⟨u,v⟩| = ‖u‖‖v‖`) happens at
   exactly two points on the circle — parallel and antiparallel — and
   nowhere near the "obvious-looking" perpendicular point where the number
   hits its *minimum*, not a maximum.
2. **Mechanic:** Mechanic A, confirmed as-is. This is a genuinely
   non-matrix scene (a single rotating vector against a fixed one, tracking
   a scalar) — there is no honest way to generalize the visual to
   polynomial/function inner products (no arrows to draw), and the current
   scene doesn't try to; it demonstrates the ℝ² special case and lets the
   prose bridge to the abstract definition. No change recommended.
3. **Trap:** already correctly sourced — *"Trap 3: Confusing equality in
   Cauchy–Schwarz"* — and already the one beat that carries it (the
   perpendicular-point beat, at `t=90°`). Keep as-is.
4. **Honest-math constraints:** the equal-scale `view_box` matters here
   more than almost anywhere else in this list — the entire "zero at 90°
   is the minimum, not special" argument depends on the circle reading as
   a circle. Confirm the current `view_box` (`[-1.3,1.3]×[-1.3,1.3]`) stays
   square if the scene is ever re-edited.
5. **Effort:** none — no change recommended, confirmed as the honest best.

### 3.4 trace

1. **Surprise:** add the two diagonal entries — that's the exact sum of
   both stretch factors you're about to watch the matrix apply, computed
   before finding either eigenvalue.
2. **Mechanic:** Mechanic B — **reauthor the existing `parametric` scene as
   `linear_map`.** The current scene already encodes exactly a
   `linear_map` story (`x_expr/y_expr` trace the image of the unit circle
   under `A=[[5,1],[2,4]]`, with eigen beats at `(1,1)→6` and `(1,-2)→3`)
   — this is precisely the shape `linear_map` mode exists for (the
   eigenvalues exemplar is the same pattern). Reauthoring buys: the
   morphing-arrow-field payoff (green reveal, `×λ` labels), the built-in
   equal-scale view box (`linearMapViewBox`), and the eigen-residual
   re-verification the parametric mode doesn't get for free. Zero renderer
   work — this is a pure content reauthor onto an already-shipped mode.
3. **Trap:** already correctly sourced and already the trap beat —
   *"Trap 1: Confusing trace with determinant or sum of all entries"*
   ("Students sum ALL four entries… `5+1+2+4=12`… the trace uses only the
   DIAGONAL"). Carries over unchanged; only the rendering mode changes.
4. **Honest-math constraints:** none new — the matrix, eigenpairs, and
   trap were already Wolfram-consistent by hand (`5+4=9=6+3`); reauthoring
   doesn't touch the mathematics, only which renderer mode draws it.
5. **Effort:** S — content-only, no renderer change (Mechanic B is already
   shipped).

### 3.5 systems-of-equations

1. **Surprise:** slide one line's slope toward parallel with the other and
   watch their crossing point run away toward the edge of the screen — that
   flight to infinity *is* what "no solution" looks like, and it happens
   only when the coefficient matrix's rank drops, never from the
   right-hand side.
2. **Mechanic:** Mechanic A, **reauthored** — same `parametric` mode, new
   story. Fix line 1 as `x+y=3`; let line 2 be `x−ty=0` (its slope
   parameterized by `t`, not its intercept). Solving gives
   `x(t)=3t/(t+1)`, `y(t)=3/(t+1)` — both expressible directly in the
   existing evaluator (division is supported). As `t→−1` the two lines
   become parallel (`x+y=0` vs `x+y=3` — same direction, different
   constant, so *inconsistent*, not merely non-unique) and the denominator
   → 0, so the traced point rushes toward the edge of the view box. Choose
   `t ∈ [-0.9, 0.5]` (stopping short of the exact singularity, never
   dividing by zero) so the last beats show the point already fleeing.
   This replaces the current scene's story (RHS constant sliding, rank
   fixed at 2 throughout, solution always exists) with one that actually
   demonstrates rank *changing*.
3. **Trap:** already correctly sourced by the current scene and **stays
   the same bullet**, just demonstrated more sharply — *"Confusing rank
   conditions… `rank(A)` and `rank(A|b)`"* (first bullet). The new framing
   makes the trap's content literally visible: the crossing point's
   flight happens because `rank(A)` drops from 2 to 1 while the two
   constants (`3` and `0`) stay unmatched, so `rank(A|b)` stays 2 —
   exactly the mismatch the trap names, shown instead of asserted.
4. **Honest-math constraints:** the scene can only ever *approach* the
   rank-drop, never land on it exactly (division by zero would break
   sampling) — beat text must say "runs toward" / "flies off," never "hits
   infinity," and must not claim the scene shows the coincident-lines
   (infinite-solutions) case, which needs the RHS to *also* line up and
   isn't part of this story. State plainly in the beat prose that this
   scene demonstrates the inconsistent case only; infinite-solutions stays
   a sentence in prose above the fence, as it already is.
5. **Effort:** M — same mode, meaningfully different authored scene (new
   expressions, new beat script, new view_box sized to show the flight).

### 3.6 limits

1. **Surprise:** `sin(x)/x` is undefined at `x=0` by direct substitution,
   yet the actual output values march steadily toward exactly 1 as `x`
   shrinks — division-by-zero at the destination doesn't mean there's no
   destination.
2. **Mechanic:** Mechanic A, confirmed as-is. The existing scene (trace of
   `sin(t)/t` as `t→0⁻`, ghost at `y=0` for the "limit is 0" misread) is
   already the canonical correct use of `parametric` + `ghost` — this is
   the mode working exactly as designed, and the two non-LA proof scenes
   in the resonance rollout chose this concept precisely because it
   demonstrates the mechanism cleanly. No change recommended.
3. **Trap:** already correctly sourced — *"Forgetting `sin(x)/x=1`"*
   (first bullet), shown via the `ghost` at `y=0` exactly where the
   trap describes the wrong guess. Keep as-is.
4. **Honest-math constraints:** none — already honest (states the limit is
   proven by the squeeze theorem, not "suggested by the trace," in the
   final beat).
5. **Effort:** none — no change recommended.

### 3.7 derivatives-basic

1. **Surprise:** the derivative of `cos x` is `−sin x`, not `sin x` — watch
   the secant slope through `π/2` converge to a *negative* number while a
   sign-dropped ghost path lands on the *positive* mirror image at the
   exact same `x`.
2. **Mechanic:** Mechanic A, confirmed as-is. The existing scene (secant
   point converging on `x=π/2` on `y=cos x`, ghost tracing the wrong-sign
   companion) is already a correct, honest use of `parametric` + `ghost`.
   No change recommended for the core mechanic.
3. **Trap:** already correctly sourced — *"Trap 3 — Sign on `−sin x`"*
   ("Students drop the minus under time pressure"), shown via the ghost
   landing on the mirrored positive value. Keep as-is.
4. **Honest-math constraints:** none new.
5. **Effort:** none for the core scene. **One optional, NOT-RECOMMENDED
   enhancement noted for completeness** (§8): drawing the actual secant
   *line* (not just the moving point) would make the slope's convergence
   visually explicit rather than caption-only — this needs a new
   "reference segment" primitive (a second fixed point + a connecting
   line), benefits exactly one concept in this list, and the existing
   scene is already honest and effective without it. Not recommended now.

### 3.8 vector-spaces (pass-over revisit)

1. **Surprise (the one a mechanic *could* deliver honestly):** a set that
   looks like it should be a vector space — it has plenty of nonzero
   points — fails the instant you add two of its own members and the sum
   lands *off* the set.
2. **Mechanic considered:** a `point_pair` closure-test primitive — two
   fixed points on a candidate set, their vector sum drawn via the
   parallelogram rule, with a visible pass/fail on whether the sum stays
   in the set. This is a genuinely **new mode** (the renderer today draws
   one trace + one head + one optional ghost; it cannot place two
   independent points and a third derived one with connecting segments).
3. **Trap it would show:** *"Assuming non-zero implies subspace"*
   (`{(x,y): x+y=1}` contains nonzero points but fails closure) — a real,
   well-grounded trap this mechanic could honestly demonstrate.
4. **Verdict: PASS-OVER CONFIRMED, not reversed.** The concept's actual
   claim — that arrows, polynomials, ODE solutions, and continuous
   functions all obey the *same* two rules — cannot be shown by any 2D
   scene without either (a) only ever depicting the arrows case, silently
   implying the others generalize the same way (the exact
   never-invent-a-misleading-scene violation the repo's content discipline
   forbids), or (b) drawing polynomials/functions as if they were 2D
   points, which is not what they are. The closure-test idea above is
   real and honest, but it demonstrates a *subspace test*, not "one
   theory covers four different kinds of object" — the concept's actual
   headline surprise. Building a new primitive to show a narrower claim
   than the concept's own hook makes isn't the right use of a new mode.
   The four-example prose list stays the correct, honest treatment.
5. **Effort:** N/A (not recommended); if ever revisited, the `point_pair`
   primitive is a genuinely new mode, effort L, and should be justified by
   more than one concept before it's built (see §8).

### 3.9 lu-factorization (pass-over revisit)

1. **Surprise:** the intimidating matrix `A` was secretly two simple
   triangular steps wearing a trenchcoat — watch the same arrows morph
   through `U`, then continue morphing through `L`, and land in exactly
   the same place a single `A`-step would have put them.
2. **Mechanic: REVERSE THE PASS-OVER — Mechanic C** (the same two-stage
   morph extension cayley-hamilton needs). `A=LU` is applying `U` then `L`
   to a vector (`Ax = L(Ux)`), and both `L` and `U` are honestly linear —
   this is exactly the shape Mechanic C is for, and it directly refutes
   the original "no honest geometry to animate" reasoning: the geometry
   was there, `linear_map` mode alone just couldn't show a *composition*.
   Concrete, hand-verified example: `A=[[2,3],[4,7]]`, Doolittle gives
   `U=[[2,3],[0,1]]`, `L=[[1,0],[2,1]]` (check: `L·U =
   [[2,3],[4,7]]` = `A` ✓). Stage 1 = `U` (label "apply U"), final
   cumulative = `A` (label "apply L" for stage 2).
3. **Trap — genuinely hard, flagged rather than forced.** None of the
   five listed traps reduces cleanly to a whole-plane morph: diagonal
   convention (Doolittle vs Crout) and forward/backward substitution
   order are procedural facts about *solving*, not about what `A=LU`
   looks like geometrically; arithmetic slips aren't visual. The one
   candidate is *"Trap 4: Assuming LU exists without checking pivots"* —
   a matrix with a zero leading pivot would make the `U`-stage collapse
   the plane onto a line instead of shearing it (visually distinct from a
   healthy invertible stage), which *would* honestly show "the shortcut
   doesn't exist here." This needs a second, singular example matrix and
   is more setup than the first LU scene needs to carry. **Recommendation:
   ship the two-stage scene beat-only, no trap, for the first cut** — all
   5 traps stay in prose in `common-traps.md` as they are today; revisit
   Trap 4 as a second scene (or a second beat pair) once Mechanic C exists
   and the pivot-failure example is separately authored and
   Wolfram-checked.
4. **Honest-math constraints:** the composed-morph guarantee (§1.1) is
   exact — `L·U` is `A` by construction, no approximation — so nothing
   about this scene risks overclaiming; the risk is entirely on the trap
   side, handled by §3 above (leave it out rather than force a weak fit).
5. **Effort:** M (once Mechanic C is built for cayley-hamilton, this is a
   second content authoring pass on the same renderer code, not a second
   build).

---

## 4. Grouping table

| Mechanic | Concepts | Renderer work |
|---|---|---|
| A — `parametric`, confirmed as-is | inner-product-spaces, limits, derivatives-basic | none |
| A — `parametric`, reauthored/retargeted | gram-schmidt (trap swap only), systems-of-equations (new story) | none |
| B — `linear_map`, reauthored | trace | none |
| C — two-stage morph (**new**) | cayley-hamilton, lu-factorization | small (types.ts + Simulation.tsx + tests) |
| Confirmed pass-over | vector-spaces | none |

One new mechanic, and it's shared across exactly the two concepts whose
surprise is inherently a *composition* of two linear steps — the narrowest
grouping that's still honest, not the widest one that sounded appealing.

---

## 5. Recommended build order

1. **Content-only reauthors first (zero code, ship immediately):** trace
   (→ `linear_map`), gram-schmidt (trap retarget), systems-of-equations
   (new rational-function story). Three concepts improved with no
   renderer PR, no review of new code, no regression surface added to
   `Simulation.tsx`.
2. **Build Mechanic C** (`stages: Mat2[]` on `LinearMapSceneSpec` +
   multi-stage morph in `Simulation.tsx` + validator's cumulative-product
   check + unit/RTL tests, following the same discipline
   `checkLinearMap`'s eigen-residual check already sets). Unlocks two
   concepts in one PR.
3. **Author cayley-hamilton** on Mechanic C — its matrix and eigenpairs
   already exist and are already verified; this is the cheapest possible
   first real use of the new mechanic and doubles as its own test case.
4. **Author lu-factorization** on Mechanic C, beat-only (no trap per
   §3.9) — reverses the pass-over, closes the "two honest, named
   pass-overs" list down to one.
5. **inner-product-spaces, limits, derivatives-basic:** no action —
   already the honest best; re-verify they still pass
   `ci:variant-agreement` and `lint-interactive-specs` untouched.
6. **vector-spaces:** no action — pass-over re-confirmed, reasoning
   updated in this doc rather than left as a stale one-line note.

---

## 6. NOT-RECOMMENDED

- **A new `point_pair`/closure-test mode for vector-spaces.** Real and
  honest for a narrower claim (subspace closure), but narrower than the
  concept's actual headline surprise (one theory, four unrelated-looking
  objects) — see §3.8. Single-concept ROI; revisit only if another
  concept in the graph independently needs the same "add two points, test
  membership" shape (e.g. a future `subspaces`-specific atom, not this
  one).
- **A "reference segment" / explicit secant-line primitive for
  derivatives-basic.** Would make the slope's convergence more literally
  visible, but the existing scene is already honest and effective via
  caption + ghost; benefits exactly one concept here. Not worth a new
  primitive for one concept — revisit if a second calculus concept
  (tangent-line-family scenes) independently wants it.
- **Any attempt to render polynomial- or function-space vectors as 2D
  points**, for vector-spaces or otherwise. This is not a "not yet"
  — it is a hard no. There is no honest 2D representation of a degree-3
  polynomial or a continuous function as a point a circle-morph can act
  on; any such scene would misrepresent the object, which the repo's own
  "never invent a misleading scene" rule (already invoked once, for the
  original vector-spaces/lu-factorization pass-overs) forbids outright.
- **An `LU` vs `UL` order-matters ghost for lu-factorization.** Visually
  natural (mirrors the already-shipped `matrix-operations` `AB≠BA`
  trap), and easy to build once Mechanic C exists — but not sourced from
  the concept's own `common-traps.md`, which lists no such trap. Building
  a trap the content doesn't actually warn about would be manufacturing
  evidence rather than visualizing it; skip unless a future edit of
  `common-traps.md` adds this trap for a real reason.
- **Per-stage `eigen` claims inside Mechanic C.** Scoped out of the
  minimal spec (§1.1) deliberately — the final-matrix-only check keeps
  the validator's re-verification logic to one code path instead of N,
  and neither cayley-hamilton nor lu-factorization needs an intermediate
  eigen claim to make its point.
- **Gram-Schmidt on Mechanic C.** Considered and rejected in §3.2 —
  staging whole-plane projection matrices would answer a question ("what
  happens to every arrow") the concept doesn't ask ("what happens to
  *this* vector"), and drags in dramatics the beat script doesn't need.
