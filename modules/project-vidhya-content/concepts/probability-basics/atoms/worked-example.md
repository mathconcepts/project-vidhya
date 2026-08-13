---
id: probability-basics-worked-example
concept_id: probability-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# GATE Problem: Bayes' Theorem — Factory Defects

## Problem Statement

A factory has three machines $M_1$, $M_2$, $M_3$ producing **60%**, **30%**, and **10%** of total output respectively. Their defect rates are **2%**, **3%**, and **5%** respectively.

A randomly selected item is found to be **defective**. What is the probability that it was produced by machine $M_1$?

---

## Step 1 — Define Events

Let $D$ = "item is defective" and $M_i$ = "item came from machine $i$".

**Prior probabilities** (production shares):

$$P(M_1) = 0.60, \quad P(M_2) = 0.30, \quad P(M_3) = 0.10$$

**Likelihoods** (defect rates given each machine):

$$P(D \mid M_1) = 0.02, \quad P(D \mid M_2) = 0.03, \quad P(D \mid M_3) = 0.05$$

---

## Step 2 — Total Probability of a Defective Item

The three machines partition the entire output, so by the **law of total probability**:

$$P(D) = P(D \mid M_1)\,P(M_1) + P(D \mid M_2)\,P(M_2) + P(D \mid M_3)\,P(M_3)$$

$$P(D) = (0.02)(0.60) + (0.03)(0.30) + (0.05)(0.10)$$

$$P(D) = 0.012 + 0.009 + 0.005 = 0.026$$

---

## Step 3 — Apply Bayes' Theorem

$$P(M_1 \mid D) = \frac{P(D \mid M_1)\,P(M_1)}{P(D)} = \frac{0.012}{0.026}$$

$$\boxed{P(M_1 \mid D) = \frac{6}{13} \approx 0.4615}$$

---

## Step 4 — Sanity Check

Compute all three posteriors to verify they sum to 1:

$$P(M_2 \mid D) = \frac{0.009}{0.026} = \frac{9}{26} \approx 0.346$$

$$P(M_3 \mid D) = \frac{0.005}{0.026} = \frac{5}{26} \approx 0.192$$

$$0.4615 + 0.346 + 0.192 = 1.000 \checkmark$$

---

## Key Insight

$M_1$ produces 60% of all items but only 46% of defectives — its low defect rate (2%) pulls it below its production share. $M_3$ produces only 10% of items but 19% of defectives — its high defect rate (5%) punches it above its share.

Bayes' theorem balances **how often a machine runs** against **how badly it misbehaves**.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"A factory has two machines: M1 produces 70% of output with a 4% defect rate, M2 produces 30% with a 10% defect rate. What is P(D), the total probability of a defective item?","hint":"Use the law of total probability: P(D) = P(D|M1)·P(M1) + P(D|M2)·P(M2). Substitute the numbers given.","answer":"P(D) = (0.04)(0.70) + (0.10)(0.30) = 0.028 + 0.030 = 0.058"},{"prompt":"Using the same factory, a defective item is found. What is the probability it came from M2?","hint":"Apply Bayes' theorem: P(M2|D) = P(D|M2)·P(M2) / P(D). You already computed P(D) = 0.058.","answer":"P(M2|D) = (0.10 × 0.30) / 0.058 = 0.030 / 0.058 = 15/29 ≈ 0.517"}]}
```
