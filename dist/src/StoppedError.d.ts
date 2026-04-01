/**
 * This class is thrown when push() is called after stop() has been called
 */
declare class StoppedError extends Error {
    constructor(message: string);
}
export = StoppedError;
