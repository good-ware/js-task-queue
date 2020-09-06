# Requirements

This package requires ECMAScript 2017.

# Overview

This lightweight, single-dependency (Joi), unit-tested, linted queue class limits the number of tasks that can execute
at a time. The primary purpose of a task queue is to control the usage of a resource such as memory or database
connections.

Tasks are queued via async push(). This method accepts a function that starts a task and optionally returns a Promise.
When the queue's maximum size has been reached, push() waits for a task to complete. The provided function is called
only when the queue has an available slot. push() returns an object with a 'promise' property. This property is set to
the return value of the provided function if it returns a Promise; otherwise, it's a new Promise that resolves to the
outcome of the function (either an exception or a value). See the example below.

Although several packages address this use case, this class is apparently the only one that allows tasks to be queued
post-instantiation without using generators.

# Example

```js
// The following script instantiates at most two promises at a time. It outputs roughly: 2, 1, 4, 3
const queue = new TaskQueue({size: 2});

// #1 This await returns immediately because the queue has an open slot. It doesn't wait for the task to complete.
await queue.push(()=>new Promise(resolve=>setTimeout(()=>resolve(console.log('1 '+Date.now())), 400)));
// #2 This await returns immediately because the queue has an open slot.
await queue.push(()=>new Promise(resolve=>setTimeout(()=>resolve(console.log('2 '+Date.now())), 300)));

// The queue is full. #2 will finish in about 300 ms.

// #3 This await waits until #2 finishes
await queue.push(()=>new Promise(resolve=>setTimeout(()=>resolve(console.log('3 '+Date.now())), 200)));

// The queue is full again. 300 ms have already passed. #1 will terminate in about 100 ms, leaving #3 in the queue.

// #4 This await waits until #1 finishes
const ret = await queue.push(()=>new Promise(resolve=>setTimeout(()=>resolve(console.log('4 '+Date.now())), 100)));

// Finally, wait for #4 to finish. push() returns an object with a 'promise' property so you can wait for the queued
// task to resolve.
await ret.promise;
```
