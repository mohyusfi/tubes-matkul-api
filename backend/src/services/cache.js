import NodeCache from 'node-cache';
import logger from './logger.js';

const defaultTTL = parseInt(process.env.CACHE_TTL_SECONDS || '300', 10);

const memoryCache = new NodeCache({
  stdTTL: defaultTTL,
  checkperiod: 0, // Cek expired saat get, tidak menahan event loop dengan interval
  useClones: false
});

export const cacheService = {
  get(key) {
    const value = memoryCache.get(key);
    if (value !== undefined) {
      logger.debug('CACHE', `Cache HIT untuk key: ${key}`);
      return value;
    }
    logger.debug('CACHE', `Cache MISS untuk key: ${key}`);
    return undefined;
  },

  set(key, value, ttl = defaultTTL) {
    logger.debug('CACHE', `Cache SET untuk key: ${key} (TTL: ${ttl}s)`);
    return memoryCache.set(key, value, ttl);
  },

  has(key) {
    return memoryCache.has(key);
  },

  del(key) {
    return memoryCache.del(key);
  },

  flush() {
    return memoryCache.flushAll();
  },

  close() {
    return memoryCache.close();
  }
};

export default cacheService;
