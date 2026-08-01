# UI kit — content studio

Admin draft review, from `src/content-studio/types.ts` (`ContentDraft`,
`SourceAttempt`, `StudioDraftStatus`).

- **Provenance is the product.** Click any draft in the queue and the trust
  treatment changes: a Wolfram draft wears the receipt marker, an LLM draft wears
  nothing and says so in plain words.
- **The body reads like a student would read it** — 17px at 58 characters, inside
  the one focal block.
- **How it was made** lists every source attempt with its outcome
  (`used / empty / errored / skipped`) and timing.
- Approve promotes to the library; Reject requires a reason and keeps the draft as
  the audit line. Archive is explained on the row it supersedes.
