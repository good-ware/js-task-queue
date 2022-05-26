/**
 * This class is thrown when push() is called after stop() has been called
 */
class StoppedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StoppedError';
  }
}

module.exports = StoppedError;
