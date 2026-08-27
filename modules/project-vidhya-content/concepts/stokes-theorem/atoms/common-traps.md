---
id: stokes-theorem.common-traps
concept_id: stokes-theorem
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Right-hand rule confusion**: The orientation of curve $C$ and surface normal $\mathbf{n}$ must be consistent: if you curl your right hand's fingers along $C$, your thumb points along $\mathbf{n}$. Reversing one flips the sign. **Draw a picture** before applying Stokes' Theorem.

- **Curl calculation errors**: Computing $\nabla \times \mathbf{F}$ by hand is error-prone. Use the determinant form carefully: the $j$-component has a **minus sign** in front. Many students forget this and get sign errors that cascade through the answer.

- **Choosing the wrong surface**: A closed curve $C$ bounds **infinitely many** surfaces. You can use any one—pick the simplest! If $C$ is the intersection of a sphere and plane, use the disk in the plane (much easier than the spherical cap).

- **Reaching for the wrong theorem**: Green, Stokes and Gauss all trade a boundary integral for an integral over what it bounds, so under exam pressure they blur together. Two questions separate them every time: *is the boundary a curve or a surface?* and *is that surface closed?* Walk the tree below until the answer is automatic.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Green, Stokes or Gauss?",
  "steps": [
    {
      "prompt": "Before naming a theorem, ask what the integral is taken over. What are the only two answers?",
      "hint": "Each theorem trades a boundary for the thing the boundary encloses. So the question is: what is the boundary here?",
      "answer": "A curve or a surface. A curve integral (∮_C F·dr) can only become an integral over a surface — that is Green (flat) or Stokes (curved). A surface integral can only become an integral over a solid — that is Gauss, and only if the surface is closed."
    },
    {
      "prompt": "You have ∮_C F·dr around a closed curve. Which second question decides between Green and Stokes?",
      "hint": "Green's theorem produces a double integral over a plane region D. Ask whether such a region exists.",
      "answer": "Does C lie flat in a plane? If it does, the region D it bounds is right there and Green applies: ∮_C F·dr = ∬_D (∂Q/∂x − ∂P/∂y) dA. If C leaves the plane, there is no D, and you need Stokes over any orientable surface with C as its boundary."
    },
    {
      "prompt": "You have ∬_S F·dS. Which second question decides whether Gauss applies?",
      "hint": "Gauss converts to a triple integral over a solid region V. Ask whether a solid exists.",
      "answer": "Is S closed? Only a closed S bounds a solid V, and then ∬_S F·dS = ∭_V (div F) dV. If S has a boundary curve it is open, so Gauss cannot reach it — and ∬_S (curl F)·dS over that open S is Stokes' territory instead."
    }
  ],
  "branches": {
    "v": 1,
    "nodes": [
      {
        "id": "n_boundary",
        "question": "What is the integral you are handed taken over?",
        "options": [
          { "label": "A closed curve C", "next": "n_curve_flat" },
          { "label": "A surface S", "next": "n_surface_closed" }
        ]
      },
      {
        "id": "n_curve_flat",
        "question": "Does that curve lie flat in a plane, bounding a region D?",
        "options": [
          { "label": "Yes — it is a plane curve", "next": "n_plane_pick" },
          { "label": "No — it is a space curve bounding a surface", "next": "n_space_pick" }
        ]
      },
      {
        "id": "n_surface_closed",
        "question": "Is the surface closed — does it enclose a solid region V?",
        "options": [
          { "label": "Closed: it encloses a solid", "next": "n_closed_pick" },
          { "label": "Open: it has a boundary curve ∂S", "next": "n_space_pick" }
        ]
      },
      {
        "id": "n_plane_pick",
        "question": "Which theorem turns ∮_C F·dr around a plane curve into a double integral over D?",
        "options": [
          { "label": "Green's theorem", "next": "leaf_green" },
          { "label": "Stokes' theorem", "next": "leaf_stokes_overkill" },
          { "label": "The divergence theorem", "next": "leaf_gauss_no_solid" }
        ]
      },
      {
        "id": "n_space_pick",
        "question": "A loop in space and an oriented surface hanging from it. Which theorem trades one for the other?",
        "options": [
          { "label": "Stokes' theorem", "next": "leaf_stokes" },
          { "label": "Green's theorem", "next": "leaf_green_flat_only" },
          { "label": "The divergence theorem", "next": "leaf_gauss_needs_closed" }
        ]
      },
      {
        "id": "n_closed_pick",
        "question": "You want the outward flux ∬_S F·dS through that closed surface. Which theorem?",
        "options": [
          { "label": "The divergence theorem", "next": "leaf_gauss" },
          { "label": "Stokes' theorem", "next": "leaf_stokes_no_boundary" },
          { "label": "Green's theorem", "next": "leaf_green_2d_only" }
        ]
      }
    ],
    "leaves": [
      {
        "id": "leaf_green",
        "method": "Green's theorem: ∮_C F·dr = ∬_D (∂Q/∂x − ∂P/∂y) dA",
        "reason": "The curve is closed, simple and flat, so the region D is sitting right there. F = (P, Q) needs continuous partial derivatives on D.",
        "best": true
      },
      {
        "id": "leaf_stokes_overkill",
        "method": "Stokes' theorem",
        "reason": "Not false — Green's theorem is the flat special case of Stokes — but on a plane curve it makes you build a surface and an orientation you did not need. Take Green and keep the whole computation in two dimensions.",
        "best": false
      },
      {
        "id": "leaf_gauss_no_solid",
        "method": "The divergence theorem",
        "reason": "The divergence theorem trades a closed surface for the solid it encloses. A curve in the plane bounds no solid, so there is nothing here for it to convert.",
        "best": false
      },
      {
        "id": "leaf_stokes",
        "method": "Stokes' theorem: ∬_S (curl F)·dS = ∮_{∂S} F·dr",
        "reason": "S must be orientable and smooth, and ∂S must carry the orientation induced by the normal by the right-hand rule. Any surface with that boundary works, so pick the easiest one — usually the flat disk.",
        "best": true
      },
      {
        "id": "leaf_green_flat_only",
        "method": "Green's theorem",
        "reason": "Green's theorem is Stokes' theorem restricted to a flat region of the xy-plane. This curve leaves the plane, so the double integral Green produces has no region to sit on.",
        "best": false
      },
      {
        "id": "leaf_gauss_needs_closed",
        "method": "The divergence theorem",
        "reason": "The divergence theorem needs a closed surface bounding a solid. A surface with a boundary curve is open, so the theorem does not reach it.",
        "best": false
      },
      {
        "id": "leaf_gauss",
        "method": "The Divergence Theorem: ∬_S F·dS = ∭_V (div F) dV",
        "reason": "S is the closed boundary of the solid V, so the flux becomes a triple integral. Check that div F is simpler than the surface integral before you commit — occasionally it is not.",
        "best": true
      },
      {
        "id": "leaf_stokes_no_boundary",
        "method": "Stokes' theorem",
        "reason": "Stokes needs a boundary curve to hand the integral to, and a closed surface has none. That is exactly why ∬_S (curl F)·dS = 0 over any closed S — a useful fact, but it does not compute the flux of F itself.",
        "best": false
      },
      {
        "id": "leaf_green_2d_only",
        "method": "Green's theorem",
        "reason": "Green's theorem is a statement about a flat region in the plane. A closed surface in 3-D is outside its reach; the divergence theorem is the 3-D statement you want.",
        "best": false
      }
    ]
  },
  "caption": "Every route is walkable. Pick the one you would actually take, then read why it lands where it does."
}
```
