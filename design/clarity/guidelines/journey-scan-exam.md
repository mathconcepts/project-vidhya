# Journey map — camera scan & mock exam

Two student surfaces that sit outside the daily loop. Grounded in
`frontend/src/components/app/CameraInput.tsx` and
`frontend/src/pages/app/MockExamPage.tsx`.

## Camera scan — "this understood my handwriting"

The repo names this **bliss checkpoint 1**. The whole surface exists to earn one
reaction, so nothing may compete with the viewfinder.

| # | Touchpoint | One job | Notes |
|---|---|---|---|
| S1 | Viewfinder | Frame the problem | Full-bleed dark. Corner marks only — no grid, no toolbar, no filters. Two controls: shutter (72px) and gallery. |
| S2 | Reading | Say what is happening | One line, no spinner theatre: "Reading your handwriting…" |
| S3 | Read-back | Let the student correct the machine before it answers | Show the extracted problem as **editable text**, not as a claim. "Is this right?" + Looks right / Edit. |
| S4 | Answer | Solve it, then show the receipt | Reuses the tutor thread and `ReceiptBadge`. |
| S5 | Save | One offer, ignorable | "Saved to your notes" as a quiet line, not a modal. |

**Rules.** The camera screen is the one place the theme goes dark — the viewfinder
is content and everything else recedes. 5MB / 1024px limits are enforced silently;
errors are one sentence in place, never an alert. Failure always offers a way
through ("Type it instead").

## Mock exam — three hours of not being interrupted

| # | Touchpoint | One job | Notes |
|---|---|---|---|
| M1 | Brief | Set expectations honestly | Two numbers (minutes, questions), one sentence on calibration, four rules as plain lines. One button. |
| M2 | Question | Nothing but the question | Sticky timer + "12 of 65" only. Options are 52px rows; selection is an indigo fill, not a border. |
| M3 | Palette | Get anywhere fast | A grid, revealed on tap — not permanently on screen eating a third of it. Answered = green, current = ink, untouched = grey. |
| M4 | Last 10 minutes | Warn once | Timer turns red at 10:00. No banner, no toast, no shake. |
| M5 | Submit | Confirm what is unfinished | "3 unanswered" stated plainly before the button. |
| M6 | Result | One number, then the honest breakdown | Marks out of max, correct/wrong/skipped as a three-item row, topic table, one next action. |

**Rules.** No countdown gradients, no per-question animation, no score
celebration — a mock is diagnostic, not a milestone. Negative marking is shown as
a signed mono number so it cannot be misread. Results never say "GBrain updated
your mastery vector"; they say what changed for the student.
