// ----------------------------------------------------------------------------
// © 2022 Eungsik Yoon <yoon.eungsik@gmail.com>
// ----------------------------------------------------------------------------

import spawn from 'child_process';
import { Container } from 'typedi';
import { RequestAs, ResponseAs } from '../server/expressEx';
import config from 'config';
import xlog from '../utils/xlog';
import * as xutil from '../utils/xutil';
import RedisConnPool from '../redislib/connPool';

interface LockItem {
  hash: string;
  path: string;
}

interface RequestBody {
  branch: string | undefined;
  user: string;
  files: LockItem[];
}

interface ResponseBody {
  ok: boolean;
  msg: string | undefined;
}

// ----------------------------------------------------------------------------
function checkSingleFileHash(
  filePath: string,
  hash: string,
  branch: string
): Promise<string> {
  const command = `git -C ${config.get(
    'repoRoot'
  )} log origin/${branch} -n 1 --pretty=format:%H -- ${filePath}`;

  xlog.debug('check single file hash:', { command });

  return new Promise((resolve, _) => {
    const child = spawn.exec(command);
    let errMsg: string = null;

    child.stdout.on('data', (buffer) => {
      xlog.verbose(
        `[check-single-file-hash] file(${filePath}), client(${hash}), server(${buffer.toString()})`
      );
      if (buffer.toString() !== hash) {
        errMsg = `On branch:${branch}, Client local file (${filePath}) not up to date!`;
      }
    });

    child.stderr.on('data', (buffer) => {
      errMsg = `git command line error: ${buffer.toString()}`;
    });

    child.on('error', (err) => {
      errMsg = err.message;
    });

    child.on('close', (exitCode) => {
      if (exitCode !== 0) {
        errMsg = `[git log] exit code: ${exitCode}`;
      }

      resolve(errMsg);
    });
  });
}

// ----------------------------------------------------------------------------
function checkFileHashes(
  lockItems: LockItem[],
  branch: string
): Promise<string[]> {
  const promises = [];
  for (const lockItem of lockItems) {
    promises.push(checkSingleFileHash(lockItem.path, lockItem.hash, branch));
  }

  return Promise.all(promises);
}

// ----------------------------------------------------------------------------
function toFilePathsJson(lockItems: LockItem[]): string {
  const filePaths = [];
  for (const lockItem of lockItems) {
    filePaths.push(lockItem.path);
  }

  return JSON.stringify(filePaths);
}

// ----------------------------------------------------------------------------
export = async (req: RequestAs<RequestBody>, res: ResponseAs<ResponseBody>) => {
  xlog.debug('/lockFiles req:', req.body);

  const branch = req.body.branch || 'master';
  const userName = req.body.user;
  const lockItems = req.body.files;
  const filePathsJson = toFilePathsJson(lockItems);

  const redisConnPool = Container.get(RedisConnPool);
  const curTimeUtc = xutil.curTimeUtc();

  return checkFileHashes(lockItems, branch)
    .then((errMsgs) => {
      for (const errMsg of errMsgs) {
        if (errMsg) {
          return errMsg;
        }
      }

      return redisConnPool['l_lockFiles'](
        userName,
        branch,
        filePathsJson,
        curTimeUtc
      );
    })
    .then((errMsg) => {
      const bOk: boolean = errMsg ? false : true;
      const resp: ResponseBody = {
        ok: bOk,
        msg: bOk ? undefined : errMsg,
      };

      if (bOk) {
        for (const lockItem of lockItems) {
          xlog.info(`User [${userName}] locks file [${lockItem.path}]`);
        }
      } else {
        xlog.warn(`/lockFiles failed. user: [${userName}], error: ${errMsg}`);
      }

      res.json(resp);
    })
    .catch((err) => {
      xlog.error(
        `/lockFiles error. user: [${userName}], error: ${err.message}`
      );

      const resp = {
        ok: false,
        msg: err.message,
      };

      res.json(resp);
    });
};
