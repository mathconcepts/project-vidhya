# UI kit — camera scan & mock exam

Two student surfaces outside the daily loop. See `guidelines/journey-scan-exam.md`
for the touchpoint pass this was built from.

| Screen | Source | Notes |
|---|---|---|
| Viewfinder | `components/app/CameraInput.tsx` | The one dark surface in the system. Corner marks, a sweep line, a 72px shutter, gallery and "type it instead". |
| Read-back | `CameraInput` + chat flow | The student corrects the machine before it answers. |
| Answer | `ChatPage` + `ReceiptBorder.tsx` | Verified result, plain-language method, quiet save line. |
| Exam brief | `MockExamPage.tsx` phase `ready` | Two numbers, three rules, one button. |
| Question | `MockExamPage.tsx` phase `in-progress` | Timer + position only; palette opens on tap; timer reddens at 10:00. |
| Result | `MockExamPage.tsx` phase `results` | Marks, three-line tally, topic table, one honest sentence. No celebration. |
