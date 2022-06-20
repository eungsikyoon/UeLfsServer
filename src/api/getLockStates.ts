// ----------------------------------------------------------------------------
// © 2022 Eungsik Yoon <yoon.eungsik@gmail.com>
// ----------------------------------------------------------------------------

import { Container } from 'typedi';
import { RequestAs, ResponseAs } from '../server/expressEx';
import xlog from '../utils/xlog';
import RedisConnPool from '../redislib/connPool';

interface LockState {
  file: string;
  user: string | undefined;
}

interface RequestBody {
  branch: string | undefined;
  user: string;
  files: string[];
}

interface ResponseBody {
  ok: boolean;
  msg: string | undefined;
  lockStates: LockState[] | undefined;
}

// ----------------------------------------------------------------------------
export = async (req: RequestAs<RequestBody>, res: ResponseAs<ResponseBody>) => {
  const branch = req.body.branch || 'master';
  const filePaths = req.body.files;
  const filePathsJson = JSON.stringify(filePaths);

  xlog.verbose('/getLockStates', {
    branch,
    filePaths,
  });

  const redisConnPool = Container.get(RedisConnPool);
  return redisConnPool['l_loadLocks'](branch, filePathsJson)
    .then((lockInfosJson) => {
      const lockInfos: any[] = JSON.parse(lockInfosJson);
      const lockStates: LockState[] = [];

      for (let i = 0; i < lockInfos.length; ++i) {
        lockStates.push({
          file: filePaths[i],
          user: lockInfos[i].user,
        });
      }

      const resp: ResponseBody = {
        ok: true,
        msg: undefined,
        lockStates,
      };

      // xlog.verbose('/getLockStates resp:', { resp });

      res.json(resp);
    })
    .catch((err) => {
      xlog.error('/getLockStates error', { err: err.message });

      const resp = {
        ok: false,
        msg: err.message,
        lockStates: undefined,
      };

      res.json(resp);
    });
};
