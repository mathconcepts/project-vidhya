---
status: DRAFT — v1, pending Giri's no-puffery review
---
# Walkthrough Scripts v1 — Student and Principal

M1 item 4 of the demo plan. Both scripts are written against what CP0 confirmed exists
today (`docs/reports/2026-08-15-cp0-code-confirmation.md`), for a Giri-narrated
screen-share on the real product. No `/demo` entry, no journey cards, no captions
overlay, no live-doubt point — none of that exists yet. These are the insurance demo:
they have to work standing alone, on the live app, seven days from now.

Both scripts use the same concept, `eigenvalues` (linear algebra), reached at
`/lesson/eigenvalues`. Using one concept for both is deliberate: if a visitor of one
kind sends a visitor of the other kind, Giri is not learning two demos.

---

## Script A — the low-confidence student (~5 min)

**Single job:** Prove she can do more of this than she believes, on one real topic,
start to finish, with no rigged win.

### 1. The picture (0:00–0:45)
**Giri does:** Opens `/lesson/eigenvalues`. The first atom on the page is the hook —
an animated ellipse tracing out live.

**Giri says:** "I'm going to show you one topic, start to finish, on the actual app —
nothing rehearsed. This is eigenvalues, from linear algebra. Just watch this shape for
a second." *(lets it trace once)* "See how the long axis keeps settling in the same
direction? That direction is called an eigenvector — it's the one direction this
matrix doesn't rotate, it only stretches, by a factor of three. That's it. That's an
eigenvalue. You just found the idea, and you haven't done any algebra yet."

**Visitor feels:** curious, not tested. A picture instead of a quiz.

**Timing:** 45s.

**If this breaks:** if the animation doesn't render, reload the page once. If it still
doesn't, say so plainly — "that's not loading right now" — and read the same fact off
the caption text sitting under it. Never imply it's supposed to look that way.

### 2. Drag it yourself (0:45–2:00)
**Giri does:** Scrolls to the second atom — the manipulable. Four sliders control the
entries of a 2×2 matrix; trace, determinant, and both eigenvalues recompute live.

**Giri says:** "Now you try — drag any of these four." *(hands over the device)*
"Watch the numbers on the right move as you do. Try to push one of the eigenvalues
negative — push b and c up, pull a and d down." *(pause while she drags)* "There it
is. You just explored how the shape of a matrix controls its own stretch factors, by
moving four sliders. Nobody handed you a formula for that. You felt it."

**Visitor feels:** agency — "I did that," not "it was shown to me."

**Timing:** 1:15.

**If this breaks:** if a slider doesn't respond to touch, try a tap on the track
instead of a drag. If it's still stuck, stop fighting it, read the formula caption
underneath out loud, and move on — don't fake a drag that isn't happening.

### 3. Work it through — the miss, on purpose (2:00–4:15)
**Giri does:** Scrolls to the worked example — a guided walkthrough: find the
eigenvalues of `A = [[4,1],[2,3]]`, four steps, each with a prompt, then a hint, then
the answer.

**Giri says:** "Now the real problem. Step one, we form A minus lambda times the
identity — that part's mechanical. Step two is where it gets interesting: before I
tap Hint, what's your guess for the equation we get when we expand the determinant?"
*(let her guess — she'll likely be unsure or wrong; that's expected)* "That's a
completely normal place to get stuck — this step trips almost everyone. Here's what
the product does about it: it doesn't just hand you the answer. It gives you a hint
first." *(tap Hint)* "Try it again with that." *(pause)* *(tap Answer)* "There — λ² −
7λ + 10 = 0. I should be straight with you: it's not grading what you said out loud,
it's a fixed three-step reveal either way. But the reveal itself is the point — it
never just dumps the answer on you." *(tap through the remaining steps to the
trace/determinant check)* "5 plus 2 is 7, the trace. 5 times 2 is 10, the
determinant. That check is how you catch your own mistakes, every time, for free."

**Visitor feels:** relief that a wrong guess didn't stall the session; real pride at
the final check landing.

**Timing:** 2:15.

**If this breaks:** if the hint/answer taps stop advancing, reload the atom. If it
still won't cooperate, all four steps' prompts and answers are already visible as
plain text on the page — read them aloud and keep going. Nothing here needs the tap
to be true.

### 4. Close (4:15–5:00)
**Giri does:** Scrolls back to the top of the lesson.

**Giri says:** "That's the whole arc — you watched it, you dragged it, you worked it,
on one topic. Three other concepts are built exactly like this one, and another
twenty-four have the step-through worked example. What did that feel like, compared
to how you usually meet something like this?"

> Accuracy note (do not read aloud): as of 2026-08-15 exactly four linear-algebra
> concepts have all three beats — eigenvalues, linear-transformations, determinants,
> orthogonality — and 24 more have the guided walkthrough only. Do not say "all of
> linear algebra is built this way." Re-check the numbers with
> `npx tsx scripts/lint-interactive-specs.ts --census` before the demo; if more
> concepts have been filled in by then, raise the count.

**Visitor feels:** closure; invited to reflect, not sold to.

**Timing:** 45s.

**If this breaks:** nothing to fail here — it's a question, not a demo step.

### Questions you will get, and straight answers
- **"How do you know the content is right?"** Every math answer here goes through a
  three-step check before it ever ships: a cache of already-verified answers first,
  then an AI model solves it twice independently, and a separate math engine —
  Wolfram Alpha — checks the two agree. The trace/determinant check we just did is
  the same idea, one you can run yourself with a pen.
- **"Is this just ChatGPT?"** No. An AI model drafts the explanation, but it never
  decides whether your final number is correct — a math engine does that, the way a
  calculator would. And what you saw today — the animation, the sliders, the
  walkthrough — isn't generated live in front of you; it's pre-built and reviewed.
- **"What happens with no internet?"** The three things you just watched have zero
  outside dependencies — there used to be a 3D graphics library pulled from a CDN;
  it's been removed. The app itself still needs to reach wherever it's hosted, same
  as any website, unless we run it on this laptop with no server call at all, which
  we can do at a venue with no signal.
- **"Does every topic look like this?"** Honestly, not yet. Linear algebra has this
  three-part arc — watch it, drag it, work it — built out across a dozen concepts.
  Other chapters have the worked examples but not yet the drag-it-yourself piece
  everywhere. That's next, not done.
- **"Is anything I did just now saved against a real account?"** We're on a guest
  session for this walkthrough, so no. If you were logged in for real, this would
  save the same way any study session does — there's no separate "demo mode" hiding
  that yet, so I want you to know that plainly rather than assume it.

### Deliberately not shown
A scripted 3-item opening diagnostic with a re-targeted "mastery peak" ending, a
journey strip ("you are here → GATE needs here"), and a `/demo` entry with a card
deck — none of that is built. The miss path above is real product behavior
(scaffolded hint-then-answer), not a stand-in for the unbuilt one.

---

## Script B — the skeptical principal (~5 min)

**Single job:** Give him something concrete to try to catch, and let it survive being
caught at.

### 1. Frame the challenge (0:00–0:45)
**Giri does:** Signs in as an admin account, opens `/admin/scenarios`.

**Giri says:** "You're here to check whether this actually adapts to a student, or
whether it's the same content wearing a different name. I'm going to show you the
same concept, generated once for a real profile with a personalization signal
attached, and once with that signal switched off. Read both and try to catch it being
the same thing twice."

**Visitor feels:** invited to be adversarial, not pitched to.

**Timing:** 45s.

**If this breaks:** if the admin page won't load, sign in again. If it still fails,
say so and open the underlying run file directly (`trial.json` / `digest.md` on
disk) and narrate from that instead — the same data, a plainer view.

### 2. Open a real run (0:45–1:45)
**Giri does:** Opens a completed scenario run for the persona `priya-cbse-12-anxious`
on `eigenvalues`.

**Giri says:** "This is a real generation run against the exact lesson a student
would see on a phone. It's driven by a written profile — her current mastery level,
a couple of specific misconceptions, whether she's anxious or confident going in. I
ran this before we sat down; I can show you the exact command if you want it —
`npm run demo:scenario priya-cbse-12-anxious eigenvalues`, one line, nothing hidden
in it."

**Visitor feels:** still skeptical, watching for the trick.

**Timing:** 1:00.

**If this breaks:** if no saved run is listed, say so and run the command live in a
visible terminal — it's local and takes under a minute. If that also fails, fall
back to the persona's YAML file on screen and read the mastery/misconception fields
aloud so he sees the input, even without the rendered output.

### 3. The side-by-side (1:45–3:30)
**Giri does:** Clicks "Show neutral version" on one event row. Two columns render:
personalized on the left, neutral on the right.

**Giri says:** "Left is what she actually got. Right is the same concept, same
source material, generated with her profile removed — a generic version. Read
both. Tell me what's different." *(pause, let him read)* "Whatever's different
between those two columns on your screen right now — that's the personalization.
Not a percentage I'm quoting you, not a testimonial. It's the same lesson, one
prompt with a student profile attached, one without."

*(If there's time, open the second locked persona, `arjun-iit-driven`, on the same
concept, and show his personalized column next to Priya's.)* "Same concept, two
different students, two different results — a driven student close to the exam
doesn't get the same version as an anxious one three weeks out."

**Visitor feels:** forced to engage with real, on-screen data instead of a claim.

**Timing:** 1:45.

**If this breaks:** the neutral-render is rate-limited to ten per admin per hour. If
it times out or the limit's hit, say exactly that — "this is rate-limited and I've
either hit it or it's slow right now" — and show a render generated earlier instead
of waiting on it live.

### 4. Say the fixture part before he asks (3:30–4:15)
**Giri does:** No new screen — stays on the side-by-side.

**Giri says:** "Before you ask: Priya is a fixture profile. A written persona, not
an enrolled student — there's no chip on this screen telling you that yet, which is
on us to build, so I'm telling you out loud instead. What's real is the generation
and the verification behind it — that runs identically for a fixture profile as it
would for an actual one."

**Visitor feels:** trust — the gap was named before he found it.

**Timing:** 45s.

**If this breaks:** if he asks to see an actual enrolled student's data, decline
plainly: "I can't show you a real student's data without their consent — that's not
a demo limit, that's the rule everywhere in this product."

### 5. Hand it back (4:15–5:00)
**Giri does:** Sits back from the keyboard.

**Giri says:** "You've been trying to catch it for four minutes. What did you find?"
*(let him answer; address whatever he raises directly)* "That's the honest state of
it today. Ask me anything else."

**Visitor feels:** he did the auditing, not Giri.

**Timing:** 45s.

**If this breaks:** nothing to fail — it's a question.

### Questions you will get, and straight answers
- **"How do you know the content is right?"** Every math item runs through a
  verification pipeline before it ships — a cache of pre-checked answers first, then
  an AI model solving it twice, then a separate math engine, Wolfram Alpha, checking
  the two agree. The AI never gets the final say on whether a number is correct.
- **"Is this just ChatGPT with a skin on it?"** No — and this is the exact
  distinction worth pressing on: an AI model drafts the explanation and runs the
  tutoring conversation, but it does not decide correctness. A math engine does
  that, separately, every time, the way a calculator would.
- **"What happens with no internet?"** The lesson content, the interactives, and
  what you just watched in the side-by-side don't call out to any third-party
  service to render — that dependency was removed. Generating a brand-new run live,
  like the one behind this screen, does need a connection; that's the one thing
  today's demo isn't running fully offline.
- **"How many students actually use this?"** *[Giri fills in the real, current
  number here — do not script a figure neither of us has verified today.]*
- **"What exactly was fixture versus real, in what I just saw?"** The lesson, the
  interactives, and the generation-and-verification pipeline are the real product,
  run exactly as a student would see them. The profile behind the comparison —
  Priya — is a written fixture, not an enrolled learner. I said so before you asked.
- **"Where does student data live, and is it secure?"** Postgres on Supabase, behind
  authentication and role checks — a student, teacher, and admin see different
  things by design. Happy to walk the access model in detail if that's the concern.

### Deliberately not shown
No `/demo` entry or journey-card deck — doesn't exist yet. No sample-data chip on
screen — that's said out loud today, not rendered; it's on the build list. No
skeptic receipts rail (heatmap → coverage bars → tap-through to per-student
attempts) — that's a separate, unbuilt piece of the plan, and its fixture data
doesn't reliably carry a real receipt object yet, so it isn't offered as proof here.
No "bring your own doubt" live-generation moment.

---

## Shared prep note (not part of either script)
Script B's central beat needs at least one completed scenario run before the demo —
`npm run demo:scenario priya-cbse-12-anxious eigenvalues` (and, time permitting,
the same for `arjun-iit-driven`), run once ahead of time so `/admin/scenarios` has
something to open live rather than generating cold in front of the principal.
