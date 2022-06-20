// ----------------------------------------------------------------------------
// © 2022 Eungsik Yoon <yoon.eungsik@gmail.com>
// ----------------------------------------------------------------------------

import 'reflect-metadata';
import _ from 'lodash';
import Redis from 'ioredis';
import genericPool from 'generic-pool';

import * as scriptLoader from './scriptLoader';
import xlog from '../utils/xlog';
import { Service } from 'typedi';

// ----------------------------------------------------------------------------
// Private functions.
// ----------------------------------------------------------------------------

export function generateRedisFunction(
  redisConnPool: RedisConnPool,
  redisCmd: string
) {
  //  xlog.debug('[TEMP] generating redis function : ', redisCmd);dd
  return function bridge() {
    let redisConn = null;
    const redisArgs = arguments;
    return redisConnPool
      .acquire()
      .then((conn: Redis.Redis) => {
        redisConn = conn;

        const procedure: Function = redisConn[redisCmd];
        return procedure.apply(redisConn, redisArgs);
      })
      .then((result: any) => {
        redisConnPool.release(redisConn);
        return result;
      })
      .catch((err: { message: string }) => {
        if (redisConn) {
          redisConnPool.release(redisConn);
        }

        xlog.error('redis error occurred during calling redis script ', {
          cmd: redisCmd,
        });

        throw err;
      });
  };
}

// ----------------------------------------------------------------------------
// Redis connection pool class.
// ----------------------------------------------------------------------------
@Service()
export default class RedisConnPool {
  public poolImpl: genericPool.Pool<Redis.Redis> = null;
  private name: string = null;

  async init(name: string, poolCfg: any) {
    this.name = name;

    xlog.info(`redis pool (${name}) initializing ...`, { poolCfg });

    // Load and register lua script functions.
    const scripts = await scriptLoader.loadDir();
    // Create pool.
    this.poolImpl = genericPool.createPool(
      {
        create: () => {
          return new Promise<Redis.Redis>((resolve, reject) => {
            const redisConn = new Redis(poolCfg.redisCfg);
            for (const functionName of Object.keys(scripts)) {
              const elem = scripts[functionName];
              redisConn.defineCommand(functionName, {
                numberOfKeys: 0,
                lua: elem.content,
              });
            }
            redisConn.on('connect', () => {
              // xlog.debug('[TEMP] ioredis connect');
            });
            redisConn.on('ready', () => {
              // xlog.debug('[TEMP] ioredis ready');
              resolve(redisConn);
            });
            redisConn.on('error', (err) => {
              // xlog.debug('[TEMP] ioredis err: ', err.message);
              reject(err);
            });
            redisConn.on('close', () => {
              // xlog.debug('[TEMP] ioredis close');
            });
            redisConn.on('reconnecting', () => {
              // xlog.debug('[TEMP] ioredis reconnecting');
            });
            redisConn.on('end', () => {
              // xlog.debug('[TEMP] ioredis end');
            });
          });
        },
        destroy: (redisConn_2) => {
          return redisConn_2.quit().then((value) => {});
        },
      },
      poolCfg
    );

    // Register redis built-in functions.
    // Use lazyConnect for temporary connection
    // No need to connect to the Redis server
    const tempRedisCfg = Object.assign({}, poolCfg.redisCfg, {
      lazyConnect: true,
    });
    const tempRedis = new Redis(tempRedisCfg);
    const redisCommands = tempRedis.getBuiltinCommands();
    _.forEach(redisCommands, (redisCmd) => {
      this[redisCmd] = generateRedisFunction(this, redisCmd);
    });
    // Register lua script functions.
    const functionNames = Object.keys(scripts);
    _.forEach(functionNames, (functionName_1) => {
      this[functionName_1] = generateRedisFunction(this, functionName_1);
    });
    xlog.info(`redis pool (${name}) initialized`);
  }

  async destroy() {
    await this.poolImpl.drain();
    await this.poolImpl.clear();
    xlog.info(`redis pool (${this.name}) destroyed`);
  }

  async acquire(priority?: number) {
    return this.poolImpl.acquire(priority);
  }

  async release(resource: Redis.Redis) {
    return this.poolImpl.release(resource);
  }

  async drain() {
    return this.poolImpl.drain();
  }

  async clear() {
    return this.poolImpl.clear();
  }
}
