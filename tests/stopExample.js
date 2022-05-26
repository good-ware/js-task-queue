/* eslint-disable no-promise-executor-return */
/* eslint-disable no-console */

// This script outputs (roughly): Task 2, Task 1, Task 4, Task 3

(async () => {
  // eslint-disable-next-line global-require
  const queue = new (require(".."))({ size: 1 });
await queue.push(
  () =>
    new Promise((resolve) =>
      setTimeout(() => {
        console.log(`Task 1 ${new Date().toISOString()}`);
        resolve();
      }, 1000)
    )
);

// The following calls to push() return Promises. The provided
// functions are not queued until there's an available slot in the 
// queue. The are queued in the order in which push() is called.

// Task #2 (background) : await push() waits until task #1 finishes
queue.push(
  () =>
    new Promise((resolve) =>
      setTimeout(() => {
        console.log(`Task 2 ${new Date().toISOString()}`);
        resolve();
      }, 2000)
    )
);

// Task #3 (background) : await push() waits until task #2 finishes
queue.push(
  () =>
    new Promise((resolve) =>
      setTimeout(() => {
        console.log(`Task 3 ${new Date().toISOString()}`);
        resolve();
      }, 1000)
    )
);

// Task #4 (background) : await push() waits until task #2 finishes
queue.push(
  () =>
    new Promise((resolve) =>
      setTimeout(() => {
        console.log(`Task 4 ${new Date().toISOString()}`);
        resolve();
      }, 5)
    )
);

await queue.wait();
console.log('stopped');
})();
