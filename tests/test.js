/* eslint-disable no-console */
const TaskQueue = require('../TaskQueue');

/**
 * @description Test
 * @return {Promise}
 */
async function test1() {
  // The following code will only run two promises concurrently at once.
  const queue = new TaskQueue({ size: 2 });
  const ret = await queue.push(() => new Promise((resolve) => setTimeout(() => resolve(new Date()), 3000)));
  console.log(`Waiting for value ${new Date()}`);
  console.log(`Done waiting for value: ${await ret.promise}`);
}

/**
 * @description Test
 * @return {Promise}
 */
async function test2() {
  // The following code will only run two promises concurrently at once.
  const queue = new TaskQueue({ size: 2 });
  const ret = await queue.push(
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
  const queue = new TaskQueue({ size: 2 });
  await queue.push(() => new Promise((resolve) => setTimeout(() => resolve(), 100)));
  await queue.wait();
}

/**
 * @description Test
 * @return {Promise}
 */
async function test4() {
  const queue = new TaskQueue({ size: 2 });
  await queue.push(() => new Promise((resolve) => setTimeout(() => resolve(), 100)));
  await queue.stop();
}

/**
 * @description Runs all tests
 * @return {Promise}
 */
function go() {
  return Promise.all([test1(), test2(), test3(), test4()]);
}

go().then(()=>console.log('Successful'), console.error);

