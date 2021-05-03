# Release History

## 2.0.0 2021-05-03

# Breaking Changes

- full() and isFull() replaced by full
- pushUnlessFull() removed

# New Features

- New option `workers.` Defaults to `size.` Consider `size=3` and `workers=1.` Lines 1-3 in the following example would return immediately even though only one function executes at a time. Line 4, however, would wait until the task in line 1 finishes.

```js
await queue.push(() => a); // Line 1
await queue.push(() => b); // Line 2
await queue.push(() => c); // Line 3
await queue.push(() => c); // Line 4
```
