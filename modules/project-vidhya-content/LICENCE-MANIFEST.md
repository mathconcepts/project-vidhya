# Licence Manifest

Per-bundle licence declarations. Content files' individual licences (in their `meta.yaml`) override this if different.

## Default

All content in this repo is **MIT licensed** unless individually marked otherwise.

## Per-bundle

| Bundle | Licence |
|---|---|
| `bitsat-quality-2026` | MIT |
| `community-algebra` | MIT |

## Per-concept

| Concept | Licence | `derived_from` |
|---|---|---|
| `calculus-derivatives` | MIT | none (original) |
| `linear-algebra-eigenvalues` | MIT | none (original) |
| `complex-numbers` | MIT | none (original) |

## If you're adapting from another source

Cite it in `meta.yaml`:

```yaml
derived_from:
  source: "OpenStax Calculus Volume 1, Section 3.2"
  url: "https://openstax.org/details/books/calculus-volume-1"
  licence: "CC-BY-SA-4.0"
```

And set the concept's own `licence:` to match the origin:

```yaml
licence: "CC-BY-SA-4.0"
```

Share-alike works derived from CC-BY-SA material must themselves be CC-BY-SA.
