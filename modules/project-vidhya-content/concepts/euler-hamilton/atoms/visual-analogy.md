---
id: euler-hamilton-visual-analogy
concept_id: euler-hamilton
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Euler & Hamiltonian Paths — Two Classic Stories

## Story 1: The Seven Bridges of Königsberg (Euler, 1736)

The city of Königsberg had two islands connected to each other and to the mainland by seven bridges. Residents asked:

> "Is it possible to take a walk that crosses every bridge **exactly once**?"

Euler answered **no** — and in doing so invented graph theory.

He modelled the problem as a multigraph: each landmass is a vertex, each bridge is an edge. The degree of each vertex equals the number of bridges touching that landmass:

| Landmass | Bridges (degree) |
|---|---|
| North bank | 3 (odd) |
| South bank | 3 (odd) |
| Island 1 | 5 (odd) |
| Island 2 | 3 (odd) |

All **four** vertices have odd degree. For an Eulerian path you need at most **two** odd-degree vertices (the start and end). Four odd-degree vertices make any Eulerian path impossible — there is no way to cross every bridge exactly once.

**The lesson:** Euler didn't need to try all possible routes. One simple structural observation (count the odd-degree vertices) settled the question forever.

## Story 2: The Knight's Tour (Hamiltonian Path)

A chess **knight** can jump in an "L" shape. The knight's tour asks:

> "Can the knight visit every square of an 8×8 chessboard **exactly once**?"

This is a Hamiltonian path problem on the graph where vertices are squares and edges are legal knight moves.

Unlike Euler's problem, there is no simple "count something and you're done" check. You must actually try — or use clever heuristics. A solution exists for the standard 8×8 board (found computationally), but proving or disproving one for arbitrary boards requires case analysis.

**The lesson:** Hamiltonian problems look like Euler problems but are fundamentally harder — they are NP-complete.

## The Contrast

| | Euler | Hamilton |
|---|---|---|
| Goal | Cross every **edge** once | Visit every **vertex** once |
| Solved by | Counting odd-degree vertices | No simple rule |
| Historical origin | Seven Bridges of Königsberg | Icosian game on a dodecahedron |
| Complexity | Polynomial ($O(V+E)$ check) | NP-complete |
| Analogy | Mail carrier covering every street | Travelling salesman visiting every city |

## The Mail Carrier vs. The Travelling Salesman

**Mail carrier (Euler):** Must walk down every street (edge) at least once. The Chinese Postman Problem is its optimisation form. The degree check tells you immediately whether a perfect route (each street once) exists — and if not, how many streets you'll have to repeat.

**Travelling salesman (Hamilton):** Must visit every city (vertex) exactly once and return. No polynomial-time algorithm is known for the general case. The TSP is the prototypical NP-hard optimisation problem.

## Intuition Check

| Scenario | Euler or Hamilton? |
|---|---|
| Postal route covering every road once | Euler |
| Sales route visiting every city once | Hamilton |
| Seven Bridges of Königsberg | Euler (and it's impossible) |
| Knight's tour on a chessboard | Hamiltonian path |
| Even-degree check decides everything | Euler |
| NP-complete in general | Hamilton |
