# @goodware/task-queue: A lightweight task queue

## Links

- [npm](https://www.npmjs.com/package/@goodware/task-queue)
- [git](https://github.com/good-ware/js-task-queue)
- [API](https://good-ware.github.io/js-task-queue/)
- [Releases](tutorial/releases.md)

## Requirements

ECMAScript 2017

## Installation

`npm i --save @goodware/task-queue`

## Overview

This lightweight, battle-tested, single-dependency (Joi) queue limits the number of tasks (async supported) that can execute simultaneously, in order to manage the usage of resources such as memory and database connections. Although other packages address this use case, this is apparently the only one that accepts new tasks post-instantiation without using generators.

## Usage

A task-queue object is instantiated by providing a configuration object to the constructor. The configuration object currently has only one required property:

| Name      | Description                                                              |
| --------- | ------------------------------------------------------------------------ |
| `size`    | The size of the queue                                                    |
| `workers` | The number of tasks that can execute simultaneously. Defaults to `size.` |

Functions are queued via the asynchronous method `push()`. This method accepts a function named `task.` `push()` returns a Promise that resolves to an object when `task()` is called. `task()` will not be called immediately when the queue is full. `task` does not need to return a Promise, but if it does, it can be acquired via the `promise` property of the object returned by `push().`

In summary:

- Create a queue that runs at most 10 running tasks: `new (require('@goodware/task-queue'))({ size: 10 })`
- Wait for the provided function to be invoked: `await queue.push(() => {...})`
- Wait for the provided function to finish: `await (await queue.push(() => {...})).promise`

### Example

This example runs at most two tasks at a time. It outputs: 2, 1, 4, 3.

```js
const queue = new (require('@goodware/task-queue'))({ size: 2 });

// Task #1 : await push() returns immediately because the queue is empty. 'await'
// doesn't wait for the task to complete.
await queue.push(
  () =>
    new Promise((resolve) =>
      setTimeout(() => {
        console.log(`Task 1 ${Date.now()}`);
        resolve();
      }, 400)
    )
);

// Task #2 : await push() returns immediately because the queue has an open slot
await queue.push(
  () =>
    new Promise((resolve) =>
      setTimeout(() => {
        console.log(`Task 2 ${Date.now()}`);
        resolve();
      }, 300)
    )
);

// The queue is full. Task #2 will finish in about 300 ms.

// Task #3 : await push() waits until task #2 finishes
await queue.push(
  () =>
    new Promise((resolve) =>
      setTimeout(() => {
        console.log(`Task 3 ${Date.now()}`);
        resolve();
      }, 200)
    )
);

// The queue is full again. 300 ms have already passed. Task #1 will
// terminate in about 100 ms, leaving task #3 in the queue.

// Task #4 : await push() waits until task #1 finishes
const ret = await queue.push(
  () =>
    new Promise((resolve) =>
      setTimeout(() => {
        console.log(`Task 4 ${Date.now()}`);
        resolve();
      }, 100)
    )
);

// Wait for task #4 to finish
await ret.promise;
```

## Advanced Usage

Consider the following constraints:

1. Up to 10 worker functions can execute simultaneously
2. When all 10 workers are running, up to 40 tasks can call `await push()` without waiting for a worker task to finish

These constraints can be enforced by setting `size` to 50 and `workers` to 10.

## Backpressure

`push()` returns a new Promise each time it is called, thus consuming memory. Depending on your application, it may be necessary to limit calls to `push()` when the queue is full.

For example, consider the following constraints:

1. Up to 10 worker functions can execute simultaneously
2. When all 10 workers are running, up to 50 tasks can call `push()`

These constraints can be enforced with two queues: `workers` and `waiters`. The `workers` queue executes tasks as demonstrated in the above example. The `waiters` queue counts the number of tasks that are waiting when the `workers` queue is full.

### Example

```js
const workers = new (require('@goodware/task-queue'))({ size: 10 });
const waiters = new (require('@goodware/task-queue'))({ size: 50 });

// This is the most basic implementation of backpressure
if (waiters.full()) throw Error('Busy');

// await is intentionally omitted. They are unnecessary for this example.
waiters.push(() => {
  // Perform some set-up tasks here, if needed
  // The waiters queue is used again to avoid race conditions that could allow more than 50 waiters
  waiters.push(() =>
    workers.push(() => {
      // Do the work
    })
  );
});
```
