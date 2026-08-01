One row of an inset-grouped list; stack inside a Card with `padding={0}`.

```jsx
<Card padding={0}>
  <ListRow title="Linear Algebra" subtitle="42 problems" chevron onClick={go} />
  <ListRow title="Calculus" subtitle="38 problems" chevron last />
</Card>
```

Separators are inset by the row padding, Apple-style. Set `last` on the final row.
