## 2.0.3 2020-06-07

Update docs

## 2.0.2 2021-05-03

Update docs

## 2.0.1 2021-05-03

Documentation and minor bug fixes

## 2.0.0 2021-05-03

### Breaking Changes

- full() and isFull() replaced by full
- pushUnlessFull() removed

## 1.2.0 2021-05-02

### New Features

- New option `workers.` Defaults to `size.` Consider `size=3` and `workers=1.` Lines 1-3 in the following example would return immediately even though only one function executes at a time. Line 4, however, would wait until one of the tasks started by lines 1-3 complete.

```js
await queue.push(() => a); // Line 1
await queue.push(() => b); // Line 2
await queue.push(() => c); // Line 3
await queue.push(() => c); // Line 4
```
