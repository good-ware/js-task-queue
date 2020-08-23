/* eslint-disable no-console */
const TaskQueue = require('../TaskQueue');

/**
 * @description Test
 * @return {Promise}
 */
async function test1() {
  // The following code will only run two promises concurrently at once.
  const scheduler = new TaskQueue({ size: 2 });
  const ret = await scheduler.push(() => new Promise((resolve) => setTimeout(() => resolve(new Date()), 3000)));
  console.log(`Waiting for value ${new Date()}`);
  console.log(`Done waiting for value: ${await ret.promise}`);
}

/**
 * @description Test
 * @return {Promise}
 */
async function test2() {
  // The following code will only run two promises concurrently at once.
  const scheduler = new TaskQueue({ size: 2 });
  const ret = await scheduler.push(
    () => new Promise((resolve, reject) => setTimeout(() => reject(new Error('hello there')), 2000))
  );
  console.log(`Waiting for error ${new Date()}`);

  let failed;

  try {
    await ret.promise;
    failed = true;
  } catch (error) {
    console.log(`Done waiting for error. ${new Date()} ${error.message}`);
  }

  if (failed) throw new Error('Failed to throw exception');
}

/**
 * @description Test
 * @return {Promise}
 */
async function test3() {
  // The following code will only run two promises concurrently at once.
  const scheduler = new TaskQueue({ size: 2 });
  await scheduler.push(() => new Promise((resolve) => setTimeout(() => resolve(console.log(`1 ${Date.now()}`)), 400)));
  await scheduler.push(() => new Promise((resolve) => setTimeout(() => resolve(console.log(`2 ${Date.now()}`)), 300)));
  // The next line of code will wait a little more than 300ms for the line above
  // it to finish
  await scheduler.push(() => new Promise((resolve) => setTimeout(() => resolve(console.log(`3 ${Date.now()}`)), 200)));
  await scheduler.push(() => new Promise((resolve) => setTimeout(() => resolve(console.log(`4 ${Date.now()}`)), 100)));

  await scheduler.stop();
  scheduler.start();
  await scheduler.wait();
}

/**
 * @description Runs all tests
 * @return {Promise}
 */
function go() {
  return Promise.all([test1(), test2(), test3()]);
}

go().catch(console.error);
