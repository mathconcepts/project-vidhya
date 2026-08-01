Switches between views of the same data (Week / Month, Topics / Concepts).

```jsx
<SegmentedControl options={[{value:'w',label:'Week'},{value:'m',label:'Month'}]} value={v} onChange={setV} />
```

Max four segments. If you need more, use FilterPills instead.
