interface TaskQueueLogger {
    isLevelEnabled(level: string): boolean;
    log(level: string | string[], payload: TaskQueueLogPayload): void;
}
interface TaskQueueLogPayload {
    message: string;
    name?: string;
    taskCount?: number;
}
interface TaskQueueOptions {
    name?: string;
    size?: number;
    workers?: number;
    logger?: TaskQueueLogger;
}
interface PushResult<T> {
    promise: Promise<T>;
}
type QueueTask<T> = () => T | Promise<T>;
/**
 * A queue that enforces a maximum number of simultaneously executing tasks
 */
declare class TaskQueue {
    stopped: boolean;
    logger?: TaskQueueLogger;
    taskCount: number;
    private readonly doneListeners;
    private waitListeners;
    readonly name?: string;
    readonly size: number;
    readonly workers: number;
    /**
     * Constructor. There is no need to call start() after creating a new object.
     * @param {object} options
     * @param {number} options.size The maximum number of functions that can execute at a time
     */
    constructor(options?: TaskQueueOptions);
    /**
     * Called when a task finishes
     * @private
     * @ignore
     */
    private taskFinished;
    /**
     * Same as push() but without the check for this.stopping
     * @param {function} task
     * @return {Promise}
     * @private
     * @ignore
     */
    private pushInternal;
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
    push<T>(task: QueueTask<T>): Promise<PushResult<T>>;
    /**
     * Is the queue full?
     * @return {boolean} true if the maximum number of tasks are queued
     */
    get full(): boolean;
    /**
     * Waits for running tasks to complete. Callers are not prevented callers from calling push(); thus
     * there is no guarantee that when the returned Promise resolves, the queue will have an available slot.
     * @return {Promise}
     */
    wait(): Promise<void> | undefined;
    /**
     * Waits for running tasks to complete. Prevents additional calls to push().
     */
    stop(): Promise<void> | undefined;
    /**
     * Undo method for stop(). There is no need to invoke start() after creating a new object.
     */
    start(): void;
}
declare namespace TaskQueue {
    interface Logger extends TaskQueueLogger {
    }
    interface Options extends TaskQueueOptions {
    }
    interface Result<T> extends PushResult<T> {
    }
    type Task<T> = QueueTask<T>;
}
export = TaskQueue;
