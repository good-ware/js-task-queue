"use strict";
const StoppedError = require("./StoppedError");
/**
 * All log entries use this tag
 * @ignore
 * @private
 */
const logTag = 'taskQueue';
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isPromise(value) {
    return Object.prototype.toString.call(value) === '[object Promise]';
}
function validatePositiveInteger(value, propertyName) {
    if (value === undefined)
        return undefined;
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
        throw new Error(`"${propertyName}" must be a positive integer`);
    }
    return value;
}
function validateOptions(options = {}) {
    if (!isRecord(options))
        throw new Error('"options" must be an object');
    const { name, size, workers, logger } = options;
    if (name !== undefined && typeof name !== 'string') {
        throw new Error('"name" must be a string');
    }
    if (logger !== undefined && !isRecord(logger)) {
        throw new Error('"logger" must be an object');
    }
    return {
        name,
        size: validatePositiveInteger(size, 'size'),
        workers: validatePositiveInteger(workers, 'workers'),
        logger: logger,
    };
}
/**
 * A queue that enforces a maximum number of simultaneously executing tasks
 */
class TaskQueue {
    /**
     * Constructor. There is no need to call start() after creating a new object.
     * @param {object} options
     * @param {number} options.size The maximum number of functions that can execute at a time
     */
    constructor(options = {}) {
        var _a, _b, _c, _d;
        this.stopped = false;
        this.taskCount = 0;
        this.doneListeners = [];
        this.waitListeners = [];
        const validatedOptions = validateOptions(options);
        this.name = validatedOptions.name;
        this.size = (_b = (_a = validatedOptions.size) !== null && _a !== void 0 ? _a : validatedOptions.workers) !== null && _b !== void 0 ? _b : 1;
        this.workers = (_d = (_c = validatedOptions.workers) !== null && _c !== void 0 ? _c : validatedOptions.size) !== null && _d !== void 0 ? _d : 1;
        this.logger = validatedOptions.logger;
        if (this.logger && !this.logger.isLevelEnabled(logTag)) {
            this.logger = undefined;
        }
    }
    /**
     * Called when a task finishes
     * @private
     * @ignore
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
        }
        else {
            this.taskCount = newTasks;
        }
        const doneListener = this.doneListeners.shift();
        if (doneListener) {
            doneListener();
        }
        else if (!newTasks) {
            const { waitListeners } = this;
            if (waitListeners.length) {
                this.waitListeners = [];
                waitListeners.forEach((resolve) => resolve());
            }
        }
    }
    /**
     * Same as push() but without the check for this.stopping
     * @param {function} task
     * @return {Promise}
     * @private
     * @ignore
     */
    async pushInternal(task) {
        for (;;) {
            if (this.taskCount < this.workers)
                break;
            if (this.full) {
                await new Promise((resolve) => this.doneListeners.push(resolve));
            }
            else {
                const promise = new Promise((resolve, reject) => {
                    this.doneListeners.push(() => {
                        void this.pushInternal(task).then((ret) => {
                            ret.promise.then(resolve, reject);
                        });
                    });
                });
                return { promise };
            }
        }
        let taskResult;
        let taskErrored = false;
        let taskError;
        try {
            taskResult = task();
        }
        catch (error) {
            taskErrored = true;
            taskError = error;
        }
        const taskCount = ++this.taskCount;
        if (this.logger) {
            this.logger.log(logTag, {
                message: `Task started for '${this.name}'. Tasks: ${taskCount}`,
                name: this.name,
                taskCount,
            });
        }
        let promise;
        if (isPromise(taskResult)) {
            promise = new Promise((resolve, reject) => {
                taskResult.then((value) => {
                    this.taskFinished();
                    resolve(value);
                }, (error) => {
                    this.taskFinished();
                    reject(error);
                });
            });
        }
        else {
            promise = taskErrored ? Promise.reject(taskError) : Promise.resolve(taskResult);
            this.taskFinished();
        }
        return { promise };
    }
    /**
     * Starts a task. If the queue's maximum size has been reached, this method waits for a task to finish
     * before invoking task().
     * @param {function} task A function to call. It can return a Promise, throw an exception, or return a value.
     * @throws {StoppedError} If stop() has been called
     * @return {Promise} Does not reject. Resolves to an object with the property 'promise'
     *  containing either the Promise returned by task or a new Promise that resolves to the value returned by task or
     *  rejects using the exception thrown by it. Therefore, it is not only possible to wait for the task to start, it is
     *  also possible to wait for it to finish.
     *
     *  For example:
     *  // Wait for an open slot in the queue
     *  const ret = await queue.push(()=>new Promise(resolve=>setTimeout(()=>resolve('Hello'), 5000)));
     *  // Wait for 5 seconds and output Hello
     *  console.log(await ret.promise);
     */
    push(task) {
        if (this.stopped)
            throw new StoppedError('Stopped');
        return this.pushInternal(task);
    }
    /**
     * Is the queue full?
     * @return {boolean} true if the maximum number of tasks are queued
     */
    get full() {
        return this.taskCount + this.doneListeners.length >= this.size;
    }
    /**
     * Waits for running tasks to complete. Callers are not prevented callers from calling push(); thus
     * there is no guarantee that when the returned Promise resolves, the queue will have an available slot.
     * @return {Promise}
     */
    wait() {
        if (this.taskCount)
            return new Promise((resolve) => this.waitListeners.push(resolve));
        return undefined;
    }
    /**
     * Waits for running tasks to complete. Prevents additional calls to push().
     */
    stop() {
        this.stopped = true;
        return this.wait();
    }
    /**
     * Undo method for stop(). There is no need to invoke start() after creating a new object.
     */
    start() {
        this.stopped = false;
    }
}
module.exports = TaskQueue;
