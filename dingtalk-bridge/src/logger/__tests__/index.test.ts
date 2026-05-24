/**
 * 结构化日志模块测试
 */
import { Logger, getLogger, createLogger, resetLogger, LogLevel, LogFormat } from '../../logger';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger({ level: 'debug', format: 'pretty' });
  });

  describe('setLevel', () => {
    it('should filter messages below the set level', () => {
      const mockWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      logger.setLevel('warn');
      logger.debug('should not appear');
      logger.info('should not appear');
      logger.warn('this is a warning');

      const calls = mockWarn.mock.calls.filter(
        c => typeof c[0] === 'string' && c[0].includes('this is a warning')
      );
      expect(calls.length).toBe(1);

      mockWarn.mockRestore();
    });

    it('should allow all messages at debug level', () => {
      const mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});

      logger.setLevel('debug');
      logger.debug('debug msg');
      logger.info('info msg');

      const debugCalls = mockLog.mock.calls.filter(
        c => typeof c[0] === 'string' && c[0].includes('debug msg')
      );
      const infoCalls = mockLog.mock.calls.filter(
        c => typeof c[0] === 'string' && c[0].includes('info msg')
      );
      expect(debugCalls.length).toBe(1);
      expect(infoCalls.length).toBe(1);

      mockLog.mockRestore();
    });
  });

  describe('setContext', () => {
    it('should set global context on the logger', () => {
      logger.setContext({ requestId: '123' });
      // Context is applied internally, just verifying it doesn't throw
      expect(() => logger.info('test')).not.toThrow();
    });
  });

  describe('addContext', () => {
    it('should add a key to global context', () => {
      logger.addContext('userId', 'u1');
      expect(() => logger.info('test')).not.toThrow();
    });
  });

  describe('child', () => {
    it('should create a child logger with merged context', () => {
      logger.setContext({ app: 'myapp' });
      const child = logger.child({ module: 'test' });
      expect(child).toBeInstanceOf(Logger);
    });
  });

  describe('error', () => {
    it('should log error with Error object', () => {
      const mockError = jest.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('something failed', new Error('test error'));
      expect(mockError).toHaveBeenCalled();
      mockError.mockRestore();
    });

    it('should handle non-Error error values', () => {
      const mockError = jest.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('failed', { detail: 'something' });
      expect(mockError).toHaveBeenCalled();
      mockError.mockRestore();
    });
  });

  describe('metric', () => {
    it('should log metric with name, value and unit', () => {
      const mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});
      logger.setLevel('debug');
      logger.metric('response_time', 150);
      expect(mockLog).toHaveBeenCalled();
      mockLog.mockRestore();
    });
  });

  describe('request', () => {
    it('should log HTTP requests', () => {
      const mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});
      logger.setLevel('debug');
      logger.request('GET', '/api/health', 200, 15);
      expect(mockLog).toHaveBeenCalled();
      mockLog.mockRestore();
    });
  });
});

describe('getLogger', () => {
  beforeEach(() => {
    resetLogger();
  });

  it('should return the same instance on repeated calls', () => {
    const log1 = getLogger();
    const log2 = getLogger();
    expect(log1).toBe(log2);
  });

  it('should create a new logger if reset', () => {
    const log1 = getLogger();
    resetLogger();
    const log2 = getLogger();
    expect(log1).not.toBe(log2);
  });
});

describe('createLogger', () => {
  it('should always return a new instance', () => {
    const log1 = createLogger();
    const log2 = createLogger();
    expect(log1).not.toBe(log2);
  });

  it('should create logger with custom config', () => {
    const log = createLogger({ level: 'error', format: 'json' });
    expect(log).toBeInstanceOf(Logger);
  });
});

describe('log convenience object', () => {
  beforeEach(() => {
    resetLogger();
  });

  it('should delegate to global logger instance', () => {
    const { log } = require('../../logger');
    expect(() => log.info('convenience test')).not.toThrow();
    expect(() => log.warn('warning test')).not.toThrow();
    expect(() => log.debug('debug test')).not.toThrow();
  });
});
