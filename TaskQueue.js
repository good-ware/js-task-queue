/* eslint-disable no-plusplus */
const Joi = require('joi');

const optionsSchema = Joi.object({
  name: Joi.string().description('The name of the queue. It is logged.'),
  size: Joi.number()
    .integer()
    .min(1)
    .required()
    .description('The maximum number of simultaneous tasks that can execute'),
  logger: Joi.object(),
});

const logTag = 'taskQueue';

/**
 * @description Manages tasks to execute in a queue with a maximum size.
 * @example
 *   // The following script instantiates at most two promises at a time. It outputs roughly: 2, 1, 4, 3
 *   const queue = new TaskQueue({size: 2});
 *   await queue.push(()=>new Promise(resolve=>setTimeout(()=>resolve(console.log('1 '+Date.now())), 400)));
 *   await queue.push(()=>new Promise(resolve=>setTimeout(()=>resolve(console.log('2 '+Date.now())), 300)));
 *   // The next line waits a little more than 300ms for the line above it to finish
 *   await queue.push(()=>new Promise(resolve=>setTimeout(()=>resolve(console.log('3 '+Date.now())), 200)));
 *   await queue.push(()=>new Promise(resolve=>setTimeout(()=>resolve(console.log('4 '+Date.now())), 100)));
 */
class TaskQueue {
  /**
   * Properties:
   *  {Boolean} stopping
   *  {Boolean} stopped
   *  {Object} logger
   *  {Number} taskCount The number of currently executing tasks
   *  {Function[]} waiters
   */
  /**
   * @description Constructor. There is no need to invoke start() after creating a new object.
   * @param {Object} options
   */
  constructor(options) {
    const validation = optionsSchema.validate(options);
    if (validation.error) throw new Error(validation.error.message);

    Object.assign(this, validation.value);

    if (this.logger && !this.logger.isLevelEnabled(logTag)) delete this.logger;

    this.taskCount = 0;
    this.waiters = [];
  }

  /**
   * @description Called when a task finishes
   */
  taskFinished() {
    const newTasks = this.taskCount - 1;

    if (this.logger) {
      this.logger.log(logTag, {
        message: `Task finished for '${this.name}'. Tasks: ${newTasks}`,
        name: this.name,
        taskCount: newTasks,
      });
    }

    if (newTasks < 0) {
      const message = `Task counter is negative for '${this.name}'`;
      if (this.logger) {
        this.logger.log(['error', logTag], {
          message,
          name: this.name,
        });
      }
    } else {
      this.taskCount = newTasks;
    }

    // This is a while loop because of wait()
    while (this.waiters.length) {
      const waiter = this.waiters.shift();
      waiter();
    }
  }

  /**
   * @description Starts a task. If the queue's maximum size has been reached, this method waits for a task to finish
   *  before calling func().
   * @param {Function} func Function to call. It can return a Promise, throw an exception, or return a value.
   * @return {Promise} Resolves to an object with the key 'promise' containing either the Promise returned by func or
   *  a new Promise that resolves to the value returned by func or rejects using the exception thrown by it. Therefore,
   *  it is not only possible to wait for func to start, it is also possible to wait for it to finish. For example:
   *  // Wait for an open slot in the queue
   *  const ret = await queue.push(()=>new Promise(resolve=>setTimeout(()=>resolve('Hello'), 5000)));
   *  // Wait for 5 seconds and output Hello
   *  console.log(await ret.promise);
   */
  async push(func) {
    // Wait for an available slot in the queue
    // eslint-disable-next-line no-await-in-loop
    while (this.taskCount >= this.size) await new Promise((resolve) => this.waiters.push(resolve));

    let fret;
    let err;

    try {
      fret = func(); // this could throw an exception if it's not explicitly marked async, so increment
    } catch (error) {
      err = error;
    }

    // Increment taskCount here, not earlier
    const taskCount = ++this.taskCount;

    if (this.logger) {
      this.logger.log(logTag, {
        message: `Task started for '${this.name}'. Tasks: ${taskCount}`,
        name: this.name,
        taskCount,
      });
    }

    let promise;

    if (fret instanceof Promise) {
      promise = new Promise((resolve, reject) => {
        fret.then(
          (value) => {
            this.taskFinished();
            resolve(value);
          },
          (error) => {
            this.taskFinished();
            reject(error);
          }
        );
      });
    } else {
      promise = err ? Promise.reject(err) : Promise.resolve(fret);
      this.taskFinished();
    }

    // If bare 'promise' was returned, the caller would wait for fret to resolve. Instead, callers should only wait for
    // for func to be called. Therefore, return an object that contains a 'promise' key. Awaiting on this method
    // therefore waits for an empty slot in the queue and returns a Promise that immediately resolves to an object.
    return { promise };
  }

  /**
   * @description Returns true if the maximum number of tasks are running
   * @return {Boolean}
   */
  full() {
    return this.taskCount >= this.size;
  }

  /**
   * @description Calls push(func) if the queue has an available slot
   * @param {Function} func
   * @return {Promise} Returns a falsey value if full
   */
  pushIfAvailable(func) {
    if (this.taskCount >= this.size) return false;
    return this.push(func);
  }

  /**
   * @description Waits for all running tasks to complete. Callers are not prevented callers from calling push(); thus
   *  there is no guarantee that when the returned Promise resolves, the queue will actually be empty.
   * @return {Promise}
   */
  async wait() {
    // eslint-disable-next-line no-await-in-loop
    while (this.taskCount) await new Promise((resolve) => this.waiters.push(resolve));
  }

  /**
   * @description Waits for all running tasks to complete. Prevents additional calls to push().
   */
  async stop() {
    this.stopping = true;
    await this.wait();
    this.stopping = false;
    this.stopped = true;
  }

  /**
   * @description Undo method for stop(). There is no need to invoke start() after creating a new object.
   */
  start() {
    if (!this.stopped) return;
    if (this.stopping) throw new Error('Stopping');
    this.stopped = false;
  }
}

module.exports = TaskQueue;
