/* eslint-disable no-promise-executor-return */
/* eslint-disable no-console */
const TaskQueue = require('../index');

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
  await queue.push(() => new Promise((resolve) => setTimeout(resolve, 100)));
  await queue.wait();
}

/**
 * @description Test
 * @return {Promise}
 */
async function test4() {
  const queue = new TaskQueue({ size: 2 });
  await queue.push(() => new Promise((resolve) => setTimeout(resolve, 100)));
  await queue.stop();
}

/**
 * @description Test workers < size
 * @return {Promise}
 */
async function test5() {
  console.log(`test5> ${new Date()}`);
  const queue = new TaskQueue({ size: 3, workers: 1 });

  await queue.push(() => new Promise((resolve) => setTimeout(resolve, 2000)));
  const ret = await queue.push(
    () =>
      new Promise((resolve) =>
        setTimeout(() => {
          resolve(5);
        }, 2000)
      )
  );
  console.log(`test5> I run immediately ${new Date()}`);
  await queue.push(() => new Promise((resolve) => setTimeout(resolve, 2000)));
  console.log(`test5> I run immediately ${new Date()}`);

  ret.promise.then((value) => {
    if (value !== 5) throw new Error('failed');
    console.log(`test5> 4 seconds later ... ${value} === 5 ${new Date()}`);
  });

  const ret2 = await queue.push(() => new Promise((resolve) => setTimeout(resolve, 1000)));
  console.log(`test5> 6 seconds later ${new Date()}`);

  ret2.promise.then(() => console.log(`test5> 7 seconds later ${new Date()}`));

  await queue.push(() => new Promise((resolve) => setTimeout(resolve, 1000)));
  await queue.stop();
  console.log(`test5> 8 seconds later ${new Date()}`);
}

/**
 * @description Test full
 * @return {Promise}
 */
async function test6() {
  const queue = new TaskQueue({ size: 2, workers: 1 });
  await queue.push(() => new Promise((resolve) => setTimeout(resolve, 100)));
  if (queue.full) throw new Error('failed');
  await queue.push(() => new Promise((resolve) => setTimeout(resolve, 100)));
  if (!queue.full) throw new Error('failed');
  await queue.stop();
}

/**
 * @description Runs all tests
 * @return {Promise}
 */
function go() {
  return Promise.all([test1(), test2(), test3(), test4(), test5(), test6()]);
}

go().then(
  () => console.log('Successful'),
  (error) => {
    console.error(`Failed: ${error}`);
  }
);
