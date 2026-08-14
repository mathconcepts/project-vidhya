---
id: gram-schmidt.visual_analogy
concept_id: gram-schmidt
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
modality: visual
exam_ids: ["*"]
---

# Gram-Schmidt Process: Visual Analogy

**Building a tilted tower with perpendicular levels:**

Imagine you have a stack of building blocks leaning in various directions. You want to rearrange them so each block is perpendicular to all the blocks below it, and all blocks have the same height (unit length). Here's how:

Start with the first block, tip it upright (normalize). Place the second block on top, but notice it's tilted — part of it leans in the same direction as the first block. Shave off that lean (subtract the projection), then tip the remainder upright. Now the second block is perpendicular to the first. Repeat for the third block: it leans toward both the first and second blocks, so you shave those off, then tip it upright. 

Each block, after cleaning away all projections onto lower blocks and normalizing, becomes a "pure" new direction. The result is an orthonormal scaffold where you can navigate with perfectly perpendicular axes — just like latitude, longitude, and altitude, no redundancy or correlation.

**The process as a diagram (conceptually):**

In 2D, if you start with two non-perpendicular vectors $v_1$ and $v_2$, Gram-Schmidt:
- Keeps $v_1$ (normalized to $e_1$)
- Removes $v_2$'s projection onto $e_1$, leaving a perpendicular component, then normalizes to get $e_2$

The result: two orthogonal unit vectors spanning the same plane.