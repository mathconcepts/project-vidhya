---
id: probability-jee.visual-analogy
concept_id: probability-jee
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.0
exam_ids: ["*"]
---

Picture a decision tree with two levels of branches. The first level splits into three branches — one for each machine, sized by how much of the output it makes. From each of those, a second level splits again into "defective" and "not defective," sized by that machine's own defect rate.

Total probability is just adding up every branch that ends in "defective," across all three first-level branches, to get the whole defective pile's size. Bayes' theorem is asking: of all the paths that end in "defective," what fraction of them passed through the Machine A branch specifically? You are not asking about Machine A's branch in isolation — you are asking about its SHARE of one particular kind of ending, among every path that reaches that ending, and a branch a path never passed through can never contribute a share of it.
