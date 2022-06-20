// ----------------------------------------------------------------------------
// © 2022 Eungsik Yoon <yoon.eungsik@gmail.com>
// ----------------------------------------------------------------------------

import config from 'config';
import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import Container from 'typedi';
import morgan, { TokenIndexer } from 'morgan';

import xlog from '../utils/xlog';
import RedisConnPool from '../redislib/connPool';
import * as expressError from './expressError';

// ----------------------------------------------------------------------------
// Module variables.
// ----------------------------------------------------------------------------

const app = express();

app.disable('x-powered-by');
app.disable('etag');
app.disable('content-type');

const server = http.createServer(app);

let gStopping = false;

morgan.token('user', (req: any, _res: any) => req.body.user || '');

// ----------------------------------------------------------------------------
function lockReqLog(
  tokens: TokenIndexer,
  req: express.Request,
  res: express.Response
) {
  xlog.info('lockd-req', {
    'remote-addr': tokens['remote-addr'](req, res),
    url: tokens['url'](req, res),
    status: tokens['status'](req, res),
    'response-time': tokens['response-time'](req, res),
    user: tokens['user'](req, res),
  });
  return null;
}

// ----------------------------------------------------------------------------
async function closeServer() {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve(undefined);
      }
    });
  });
}

// ----------------------------------------------------------------------------
async function stopServer() {
  try {
    xlog.info('stopping server ...');
    await closeServer();

    const redisConnPool = Container.get(RedisConnPool);
    await redisConnPool.destroy();

    xlog.info('server stopped');
    process.exitCode = 0;
  } catch (error) {
    xlog.error('graceful shutdown failed', { error: error.message });
    process.exit(1);
  }
}

// ----------------------------------------------------------------------------
export async function start() {
  try {
    const redisPoolCfg = config.get('redisPoolCfg');

    const redisConnPool = Container.get(RedisConnPool);
    await redisConnPool.init('lock-redis', redisPoolCfg);

    app.use(morgan(lockReqLog));
    app.use(bodyParser.json({ limit: '50mb' }));

    // API
    app.post('/unsafeLogin', require('../api/unsafeLogin'));
    app.post('/getLockStates', require('../api/getLockStates'));
    app.post('/lockFiles', require('../api/lockFiles'));
    app.post('/unlockFiles', require('../api/unlockFiles'));
    app.post('/unlockAll', require('../api/unlockAll'));
    app.post('/onPush', require('../api/onPush'));

    const bindAddress = config.get<number>('apiServer.bindAddress');
    const port = config.get<number>('apiServer.port');

    app.use(expressError.middleware);

    server.listen(port, bindAddress, () => {
      xlog.info('start listening ...', { bindAddress, port });
    });
  } catch (error) {
    xlog.error('Failed to start uelfsd server.', { error });
    process.exit(1);
  }
}

// ----------------------------------------------------------------------------
export async function stop() {
  if (gStopping) {
    return;
  }

  gStopping = true;

  await stopServer();
}
