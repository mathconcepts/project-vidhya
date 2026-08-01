# Journey map — teacher and owner consoles

Grounded in `docs/TEACHER-JOURNEY.md` and Part 2 of `docs/USER-JOURNEY.md`.
Both consoles are read on a laptop between other work, so the layout widens to two
columns — but the density budget does not change: **one focal block, lists on the
canvas, 17px body.**

## Teacher — Ramya, 20 students, next class in two days

The governing principle from the repo: **data with actions, never data alone.**
Every observation on these screens carries its own verb.

| # | Touchpoint | One job | Action attached |
|---|---|---|---|
| T1 | Sign-in | Say she is in teaching mode | Lands on `/teaching`, not the student home |
| T2 | Teach next | Name one concept and why | "Open the brief" |
| T3 | Teaching brief | Be the prep work someone else did | Push to review · Send an announcement |
| T4 | Cohort trends | Show what moved | Each row opens its brief |
| T5 | Attention list | Catch a student before they drop off | "Copy a check-in" — pre-filled message, her own WhatsApp |
| T6 | Announcement | One at a time, replaces the last | 280 characters, visible to students as sent |

**Rules.** No in-app DMs, no gradebook, no teacher-authored content — explicit
non-goals in the repo. Student privacy is stated on screen, not buried: the
console shows aggregate mastery and flags, never raw answers or emotional detail.
The brief is composed from existing content; it never says "generating".

## Owner — Raj, coaching institute, day zero

The repo's **bliss checkpoint 2** is the first cohort insight. Everything above it
is setup, and setup should disappear when it is done.

| # | Touchpoint | One job | Notes |
|---|---|---|---|
| A1 | First sign-in | "You're the owner. Here's what's next." | Never drop an owner on the student chat |
| A2 | Setup checklist | Order the five things | Five rows with a count; **removes itself** at 5 of 5 |
| A3 | Deployment status | Answer "is it working?" in one glance | Four rows, a dot each. Green states carry no colour beyond the dot |
| A4 | People | Counts that matter | Three numbers, one row |
| A5 | Cohort insight | The wow moment | Average mastery, students to look at, three concepts the cohort is failing — each deep-links |
| A6 | Quick links | Get out of the dashboard | Plain list, no icon tiles |

**Rules.** No sparkline until there are seven days of data — an empty chart reads
as a broken product. Red appears only for a genuinely broken integration.
Attention flags name the student and the reason, and open a check-in.
