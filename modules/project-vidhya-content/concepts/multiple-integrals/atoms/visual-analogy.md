---
id: multiple-integrals.visual-analogy
concept_id: multiple-integrals
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
scaffold_fade: true
---

# Slicing: The Loaf-Building Intuition

Think of a double integral like building a loaf of bread by stacking infinitesimal slices. Imagine you have a height function $z = f(x,y)$ that describes the thickness of each horizontal slice. As you integrate over $x$, you're sliding through all the slices at a fixed $y$-coordinate, building up a cross-sectional "strip" of bread. Then as you integrate over $y$, you stack all those strips together to form the complete loaf.

The total volume? It's the sum of all infinitesimal "pieces"—each piece is a tiny box with base area $dx \, dy$ and height $f(x,y)$.

When the region is circular or the integrand has radial symmetry, switching to **polar coordinates** is like rotating your perspective: instead of counting infinitesimal squares (which cluster wastefully near the center), you count infinitesimal **annular rings** at radius $r$, which tile the circle much more naturally. The Jacobian $r \, dr \, d\theta$ accounts for the fact that rings at different radii have different circumferences.

```gif-scene
{"type":"parametric","expression":"x^2 + t","x_range":[-2,2],"y_range":[-1,5],"t_range":[0,1],"frames":30,"fps":12}
```

The animation shows cross-sections of a paraboloid surface: as the parameter $t$ increases (representing the $y$-direction), each parabolic slice stacks upward to build the 3D volume.
