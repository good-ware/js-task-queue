import StoppedError = require('../src/StoppedError');
import TaskQueue = require('../src/index');

/**
 * @description Test
 * @return {Promise}
 */
async function test1(): Promise<void> {
  const queue = new TaskQueue({ size: 2 });
  const ret = await queue.push(() => new Promise((resolve) => setTimeout(() => resolve(new Date()), 3000)));
  console.log(`Waiting for value ${new Date().toISOString()}`);
  console.log(`Done waiting for value: ${await ret.promise}`);
  await queue.stop();
  await queue.stop();
  queue.start();
  await queue.stop();
}

/**
 * @description Test
 * @return {Promise}
 */
async function test2(): Promise<void> {
  const queue = new TaskQueue({ size: 2 });
  const ret = await queue.push(
    () => new Promise((resolve, reject) => setTimeout(() => reject(new Error('hello there')), 2000))
  );
  console.log(`Waiting for error ${new Date().toISOString()}`);

  let failed = false;

  try {
    await ret.promise;
    failed = true;
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Done waiting for error. ${new Date().toISOString()} ${error.message}`);
    } else {
      throw error;
    }
  }

  if (failed) throw new Error('Failed to throw exception');
  await queue.stop();
}

/**
 * @description Test
 * @return {Promise}
 */
async function test3(): Promise<void> {
  const queue = new TaskQueue({ size: 2 });
  await queue.push(() => new Promise((resolve) => setTimeout(resolve, 100)));
  await queue.stop();
}

/**
 * @description Test
 * @return {Promise}
 */
async function test4(): Promise<void> {
  const queue = new TaskQueue({ size: 2 });
  await queue.push(() => new Promise((resolve) => setTimeout(resolve, 100)));
  await queue.stop();
}

/**
 * @description Test workers < size
 * @return {Promise}
 */
async function test5(): Promise<void> {
  console.log(`test5> ${new Date().toISOString()}`);
  const queue = new TaskQueue({ size: 3, workers: 1 });

  await queue.push(() => new Promise((resolve) => setTimeout(resolve, 2000)));
  const ret = await queue.push(
    () =>
      new Promise<number>((resolve) =>
        setTimeout(() => {
          resolve(5);
        }, 2000)
      )
  );
  console.log(`test5> I run immediately ${new Date().toISOString()}`);
  await queue.push(() => new Promise((resolve) => setTimeout(resolve, 2000)));
  console.log(`test5> I run immediately ${new Date().toISOString()}`);

  ret.promise.then((value) => {
    if (value !== 5) throw new Error('failed');
    console.log(`test5> 4 seconds later ... ${value} === 5 ${new Date().toISOString()}`);
  });

  const ret2 = await queue.push(() => new Promise((resolve) => setTimeout(resolve, 1000)));
  console.log(`test5> 6 seconds later ${new Date().toISOString()}`);

  ret2.promise.then(() => console.log(`test5> 7 seconds later ${new Date().toISOString()}`));

  await queue.push(() => new Promise((resolve) => setTimeout(resolve, 1000)));
  await queue.stop();
  console.log(`test5> 8 seconds later ${new Date().toISOString()}`);
}

/**
 * @description Test full
 * @return {Promise}
 */
async function test6(): Promise<void> {
  const queue = new TaskQueue({ size: 2, workers: 1 });
  await queue.push(() => new Promise((resolve) => setTimeout(resolve, 100)));
  if (queue.full) throw new Error('failed');
  await queue.push(() => new Promise((resolve) => setTimeout(resolve, 100)));
  if (!queue.full) throw new Error('failed');
  await queue.stop();
}

/**
 * @description Test StoppedError
 * @return {Promise}
 */
async function test7(): Promise<void> {
  const queue = new TaskQueue({ size: 1 });
  queue.stop();
  try {
    await queue.push(() => undefined);
    throw new Error('failed - no exception');
  } catch (error) {
    const caughtError = error as Error;
    if (caughtError.name !== 'StoppedError') throw new Error('failed - wrong exception 1');
    if (!(caughtError instanceof StoppedError)) throw new Error('failed - wrong exception 2');
  }
  await queue.stop();
}

/**
 * @description Starts all tests
 * @return {Promise}
 */
function go(): Promise<void[]> {
  return Promise.all([test1(), test2(), test3(), test4(), test5(), test6(), test7()]);
}

go().then(
  () => console.log('Successful'),
  (error: unknown) => {
    console.error(`Failed: ${error}`);
  }
);
