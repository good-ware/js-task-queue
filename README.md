# @goodware/task-queue: A lightweight task queue

## Links

- [Release History](https://good-ware.github.io/js-task-queue/tutorial-CHANGELOG)
- [npm](https://www.npmjs.com/package/@goodware/task-queue)
- [git](https://github.com/good-ware/js-task-queue)
- [API](https://good-ware.github.io/js-task-queue/)
- [RunKit Example](https://runkit.com/dev-guy/exploring-goodware-task-queue)

## Requirements

NodeJS 8+

## Installation

`npm i --save @goodware/task-queue`

## Overview

This lightweight, battle-tested, single-dependency ([joi](https://www.npmjs.com/package/joi), unfortunately) task queue limits the number of tasks (synchronous or asynchronous which are of course plain old `Promises`) that execute concurrently. The purpose of limiting task execution is to control resource usage such as memory and database connections. Thus, it's an alternative to `Promise.all()`, `Promise.allSettled()` etc..

Although several packages address this use case, this is apparently the only library that can queue tasks post-instantiation without using generators. The API is, most of all, easy to learn and use.

## Creation

A task-queue object is instantiated by providing a configuration object to the constructor. The configuration object currently has one required and one optional property:

| Name      | Description                                         |
| --------- | --------------------------------------------------- |
| `size`    | The size of the queue                               |
| `workers` | The number of tasks that can execute simultaneously |

size can be provided without workers. workers can provided without size.

## Usage

Functions are queued via the asynchronous method `push(task)`. This method accepts a function named `task` and returns a Promise that resolves to an object when the `task` function is called (_not_ when `task` returns). `task` is called only when a worker is available. `task` does not need to return a Promise, but if it does, it can be acquired via the `promise` property of the object returned by `push().`

### Brief Example

- Create a queue that runs at most 10 running tasks

```js
new (require('@goodware/task-queue'))({ size: 10 });
```

- Wait for the provided function to be invoked:

```js
await queue.push(() => {...})
```

- Wait for the provided function to finish:

```js
await (await queue.push(() => {...})).promise;
```

### Code Sample

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

await queue.stop();
```

## Minimizing Memory Usage

`push()` returns a new Promise each time it is called, thus consuming memory. Depending on your application, it may be necessary to limit calls to `push()` when the queue is full if you are unable to control the number of calls to `push().`

For example, consider the following constraints:

1. Up to 10 workers can execute at the same time
2. When 10 workers are running, up to 50 tasks can call `push()` and immediately continue their work. Subsequent callers will wait until a worker has finished.

Although it appears that resources are properly constrained in this scenario, if `push()` is called, say, 1,000 times a second, and the workers take longer than 1 second each, the process will likely run out of memory. One solution to this scenario is backpressure.

No form of backpressure is a silver bullet. External systems must handle errors and retry.

### Code Sample

```js
const queue = new (require('@goodware/task-queue'))({ size: 50, workers: 10 });

async function doWork() {
  const me = Date.now();
  console.log(`${me} begin`);
  await new Promise((resolve) => setTimeout(resolve, 200));
  console.log(`${me} end`);
}

for (let i = 1; i <= 100; ++i) {
  // The most basic implementation of backpressure: wait 50 ms
  if (queue.full) {
    console.log('full');
    await new Promise((resolve)=>setTimeout(resolve, 50));
  }  
  else {
    await queue.push(doWork);
    console.log('queued');
  }    
}

await queue.stop();
```
