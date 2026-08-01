The action control — use `filled` for the single primary action on a screen and `tinted`/`grey` for everything else.

```jsx
<Button tone="mastery" size="lg" full>Start practising</Button>
<Button variant="tinted" tone="tutor">Ask the tutor</Button>
```

Tones are semantic, not decorative: green = study/mastery actions, indigo = AI/tutor actions. `sm` is 34px — only for chips inside dense rows, never as a screen's main action (44px minimum).
