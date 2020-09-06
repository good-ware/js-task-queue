# TaskQueue: A lightweight task queue for limiting resource usage

# Requirements

ECMAScript 2017

# Overview

This lightweight, single-dependency (Joi) queue class limits the number of tasks that can execute at a time. The primary
purpose of this queue is to limit the usage of resources such as memory and database connections.

Tasks are queued via async push(). This method accepts a function that starts a task and optionally returns a Promise.
Tasks are removed from the queue when they finish. When the queue's maximum size has been reached, push() waits for a
a task to complete. The provided function is called only when the queue has an available slot. push() returns an object
with a 'promise' property. This property is set to the return value of the provided function if it returns a Promise;
otherwise, it's a new Promise that resolves to the outcome of the function (either an exception or a value). See the
example below.

Although several packages address this use case, this class is apparently the only one that allows tasks to be queued
post-instantiation without using generators.

# Installation

`npm i --save @goodware/task-queue`

# Example

This example runs at most two tasks at a time. It outputs: 2, 1, 4, 3.

```js
(async () => {
  const queue = new (require('@goodware/task-queue'))({ size: 2 });

  // Task #1 : push() returns immediately because the queue is empty. 'await' doesn't wait for the task to complete.
  await queue.push(() =>
    new Promise((resolve) => setTimeout(() => {console.log(`Task 1 ${Date.now()}`); resolve();}, 400)));

  // Task #2 : push() returns immediately because the queue has an open slot
  await queue.push(() =>
    new Promise((resolve) => setTimeout(() => {console.log(`Task 2 ${Date.now()}`); resolve();}, 300)));

  // The queue is full. Task #2 will finish in about 300 ms.

  // Task #3 : push() waits until task #2 finishes
  await queue.push(() =>
    new Promise((resolve) => setTimeout(() => {console.log(`Task 3 ${Date.now()}`); resolve();}, 200)));

  // The queue is full again. 300 ms have already passed. Task #1 will terminate in about 100 ms, leaving task #3 in the
  // queue.

  // Task #4 : push() waits until task #1 finishes
  const ret = await queue.push(() =>
    new Promise((resolve) => setTimeout(() => {console.log(`Task 4 ${Date.now()}`); resolve();}, 100)));

  // Wait for task #4 to finish
  await ret.promise;
})();
```
