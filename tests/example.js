/* eslint-disable no-console */

// This script outputs (roughly): Task 2, Task 1, Task 4, Task 3

(async () => {
  // eslint-disable-next-line global-require, import/no-unresolved
  const queue = new (require('@goodware/task-queue'))({ size: 2 });

  // Task #1 : push() returns immediately because the queue is empty. 'await' doesn't wait for the task to complete.
  await queue.push(
    () =>
      new Promise((resolve) =>
        setTimeout(() => {
          console.log(`Task 1 ${Date.now()}`);
          resolve();
        }, 400)
      )
  );

  // Task #2 : push() returns immediately because the queue has an open slot
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

  // Task #3 : push() waits until task #2 finishes
  await queue.push(
    () =>
      new Promise((resolve) =>
        setTimeout(() => {
          console.log(`Task 3 ${Date.now()}`);
          resolve();
        }, 200)
      )
  );

  // The queue is full again. 300 ms have already passed. Task #1 will terminate in about 100 ms, leaving task #3 in the
  // queue.

  // Task #4 : push() waits until task #1 finishes
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
})();
