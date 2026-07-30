-- ============================================================
-- Generated-content provenance on pyq_questions + the Linear
-- Algebra chapter's MCQ items (Tier 3 / Claude-only fallback,
-- per CONTENT-TIERS.md).
--
-- pyq_questions previously assumed every row was a real official
-- past-year question (year NOT NULL, no provenance field). This
-- migration adds an honest way to distinguish machine-generated,
-- machine-verified items from real PYQs:
--   - source: 'official_pyq' (default, preserves existing rows)
--             or a generated-content tier tag, e.g. 'generated_tier3'
--   - verification_method: how a generated item's answer was checked
--     (e.g. 'sympy+claude-self-check'), NULL for official PYQs
--   - year becomes nullable: a generated item has no official exam
--     year, and forcing one would misrepresent it as a real GATE
--     paper question. The frontend already renders 'Generated' when
--     year is null (see SmartPracticePage.tsx's `year || 'generated'`).
--
-- Then seeds the 11 MCQ items (of 24 total) from the Linear Algebra
-- full-chapter demo (GATE-EM-Chapter-LinearAlgebra/index.html) that
-- fit pyq_questions' MCQ-only schema as-is. The demo's other 13 items
-- are NAT (numeric-answer) type, which pyq_questions/SmartPracticePage
-- don't support yet — left for a follow-up once that's wired up
-- (generated_problems + PracticeAttemptPage already support NAT and
-- may be the better home for those).
-- ============================================================

ALTER TABLE pyq_questions
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'official_pyq';

ALTER TABLE pyq_questions
  ADD COLUMN IF NOT EXISTS verification_method TEXT;

ALTER TABLE pyq_questions
  ALTER COLUMN year DROP NOT NULL;

INSERT INTO pyq_questions
  (exam_id, year, question_text, options, correct_answer, explanation,
   topic, difficulty, marks, negative_marks, source, verification_method)
VALUES

(
  'gate-engineering-maths', NULL,
  $$For any square matrix A, the matrix (A + Aᵀ) is always:$$,
  $${"A": "symmetric", "B": "skew-symmetric", "C": "orthogonal", "D": "idempotent"}$$::jsonb,
  'A',
  $$(A+Aᵀ)ᵀ = Aᵀ+A = A+Aᵀ — it equals its own transpose, so it's symmetric by definition. (Similarly, A − Aᵀ is always skew-symmetric — a standard GATE pairing.)$$,
  'linear-algebra', 'easy', 1, -0.33, 'generated_tier3', 'sympy+claude-self-check'
),

(
  'gate-engineering-maths', NULL,
  $$For any two n×n matrices A and B (product defined), trace(AB) equals:$$,
  $${"A": "trace(BA)", "B": "trace(A)·trace(B)", "C": "trace(A)+trace(B)", "D": "It depends on A and B — no general relation"}$$::jsonb,
  'A',
  $$trace(AB) = Σᵢ(AB)ᵢᵢ = ΣᵢΣⱼ AᵢⱼBⱼᵢ = ΣⱼΣᵢ BⱼᵢAᵢⱼ = trace(BA) — always true, even though AB ≠ BA in general. A favourite trap: don't assume AB=BA just because their traces agree.$$,
  'linear-algebra', 'medium', 2, -0.67, 'generated_tier3', 'sympy+claude-self-check'
),

(
  'gate-engineering-maths', NULL,
  $$A is a 3×3 matrix with det(A) = 5. Then det(A⁻¹) is:$$,
  $${"A": "1/5", "B": "5", "C": "1/125", "D": "−5"}$$::jsonb,
  'A',
  $$det(A⁻¹) = 1/det(A) for any invertible matrix, regardless of size n. Answer: 1/5. (Common slip: computing 1/5³ — that formula is for det(cA), not det(A⁻¹).)$$,
  'linear-algebra', 'easy', 1, -0.33, 'generated_tier3', 'sympy+claude-self-check'
),

(
  'gate-engineering-maths', NULL,
  $$The system  x + 3y = 4,  2x + 6y = k  has infinitely many solutions when k equals:$$,
  $${"A": "4", "B": "8", "C": "12", "D": "No such k"}$$::jsonb,
  'B',
  $$The left side of equation 2 is 2× equation 1's left side. Consistent (hence infinitely many solutions) only when the right side matches too: k = 2×4 = 8.$$,
  'linear-algebra', 'hard', 2, -0.67, 'generated_tier3', 'sympy+claude-self-check'
),

(
  'gate-engineering-maths', NULL,
  E'A = \n[ 2  1 ]\n[ 1  2 ]\nhas eigenvalues 1 and 3. For λ = 3, an eigenvector is proportional to:',
  $${"A": "(1, 1)", "B": "(1, −1)", "C": "(2, 1)", "D": "(1, 0)"}$$::jsonb,
  'A',
  $$(A−3I)v=0 → [−1 1; 1 −1]v=0 → v₁=v₂. Eigenvector ∝ (1,1) — verified by SymPy eigenvects(). (For λ=1 it would be (1,−1) — the classic mix-up.)$$,
  'linear-algebra', 'hard', 2, -0.67, 'generated_tier3', 'sympy+claude-self-check'
),

(
  'gate-engineering-maths', NULL,
  $$The Cayley–Hamilton theorem states that:$$,
  $${"A": "Every square matrix satisfies its own characteristic equation", "B": "Every matrix is diagonalizable", "C": "Eigenvalues of a matrix are always real", "D": "The determinant equals the product of its rows"}$$::jsonb,
  'A',
  $$If p(λ) = det(λI−A) is the characteristic polynomial, then p(A) = 0 — the matrix satisfies its own characteristic equation. This is what lets you compute high powers or the inverse of A from just trace and det, without diagonalising.$$,
  'linear-algebra', 'easy', 1, -0.33, 'generated_tier3', 'sympy+claude-self-check'
),

(
  'gate-engineering-maths', NULL,
  $$A square matrix A is called orthogonal when:$$,
  $${"A": "A·Aᵀ = I", "B": "A = Aᵀ", "C": "A² = A", "D": "A is symmetric with all positive eigenvalues"}$$::jsonb,
  'A',
  $$Definition: A·Aᵀ = Aᵀ·A = I, so Aᵀ = A⁻¹. Orthogonal matrices preserve length and angle — rotations and reflections are the standard examples.$$,
  'linear-algebra', 'easy', 1, -0.33, 'generated_tier3', 'sympy+claude-self-check'
),

(
  'gate-engineering-maths', NULL,
  $$A is idempotent, meaning A² = A. Every eigenvalue of A must be:$$,
  $${"A": "0 or 1", "B": "1 or −1", "C": "always 1", "D": "always 0"}$$::jsonb,
  'A',
  $$If Av=λv and A²=A, then A²v=λ²v but also A²v=Av=λv → λ²=λ → λ(λ−1)=0 → λ∈{0,1}. Comes up constantly with projection matrices.$$,
  'linear-algebra', 'easy', 1, -0.33, 'generated_tier3', 'sympy+claude-self-check'
),

(
  'gate-engineering-maths', NULL,
  $$In the LU decomposition A = LU (Doolittle form), L and U are:$$,
  $${"A": "L unit lower-triangular, U upper-triangular", "B": "L and U both diagonal", "C": "L orthogonal, U symmetric", "D": "L upper-triangular, U lower-triangular"}$$::jsonb,
  'A',
  $$Doolittle's convention: L has 1's on the diagonal (unit lower-triangular) and stores the elimination multipliers; U is the upper-triangular result of Gaussian elimination.$$,
  'linear-algebra', 'easy', 1, -0.33, 'generated_tier3', 'sympy+claude-self-check'
),

(
  'gate-engineering-maths', NULL,
  $$For an m×n matrix A, the rank–nullity theorem states:$$,
  $${"A": "rank(A) + nullity(A) = n", "B": "rank(A) + nullity(A) = m", "C": "rank(A) × nullity(A) = n", "D": "rank(A) − nullity(A) = 0 always"}$$::jsonb,
  'A',
  $$nullity(A) = dim(null space) = number of free variables = n − rank(A), i.e. rank(A) + nullity(A) = n (the number of columns) — always. One of the most re-used facts in this whole chapter.$$,
  'linear-algebra', 'easy', 1, -0.33, 'generated_tier3', 'sympy+claude-self-check'
),

(
  'gate-engineering-maths', NULL,
  $$Are the vectors (1,2,3), (0,1,4), and (2,3,2) linearly independent in ℝ³?$$,
  $${"A": "No — the determinant of the matrix they form is 0", "B": "Yes — any 3 vectors in ℝ³ are automatically independent", "C": "Yes — no vector here is a scalar multiple of another", "D": "Cannot be determined without more information"}$$::jsonb,
  'A',
  $$Stack the vectors as rows and take the determinant: it comes out to 0 (verified by SymPy) → linearly dependent. The trap in option C: "no vector is a multiple of another" does NOT imply independence once you have 3+ vectors — you need the determinant (or rank) test.$$,
  'linear-algebra', 'hard', 2, -0.67, 'generated_tier3', 'sympy+claude-self-check'
);
