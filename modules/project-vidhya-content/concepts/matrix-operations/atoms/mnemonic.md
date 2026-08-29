---
id: matrix-operations.mnemonic
concept_id: matrix-operations
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Inner must match, outer survive."** Write the shapes side by side in the order you're multiplying:

$$(m \times \underline{n})(\underline{n} \times p) \;\longrightarrow\; m \times p$$

The two **inner** numbers must be equal or the product doesn't exist. The two **outer** numbers are the shape of the answer. One glance kills half the options in most dimension MCQs, before any arithmetic.

**"Row hits column."** Entry $(i,j)$ of $AB$ comes from row $i$ of $A$ and column $j$ of $B$ — *row of the left one, column of the right one*, dotted together:

$$(AB)_{ij} = \sum_k a_{ik}b_{kj}$$

March **across** the left, **down** the right. The index $k$ that gets summed away is exactly the inner dimension that had to match.

**Sanity-check reflex:** before writing anything, say the output shape aloud. Then check one entry you can verify cheaply — a row of $A$ against a column of $B$ containing a zero. Most multiplication errors are index slips, and a single re-dotted entry catches them.
