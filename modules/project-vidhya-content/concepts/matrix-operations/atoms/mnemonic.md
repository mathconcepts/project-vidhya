---
id: matrix-operations.mnemonic
concept_id: matrix-operations
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Inner must match, outer survive."** Write the shapes side by side, in multiplication order:

$$(m \times \underline{n})(\underline{n} \times p) \;\longrightarrow\; m \times p$$

The two **inner** numbers must agree or the product doesn't exist. The two **outer** numbers are the answer's shape — one glance kills half the options in a dimension MCQ before any arithmetic starts.

**"Row hits column."** Entry $(i,j)$ of $AB$ comes from row $i$ of $A$ dotted with column $j$ of $B$:

$$(AB)_{ij} = \sum_k a_{ik}b_{kj}$$

March **across** the left matrix, **down** the right one. The summed index $k$ is exactly the inner dimension that had to match.

**Sanity-check reflex:** say the output shape aloud first. Then verify one entry you can check cheaply — a row of $A$ against a column of $B$ that contains a zero. Most multiplication errors are index slips, and one re-dotted entry catches them before they cost the mark.
