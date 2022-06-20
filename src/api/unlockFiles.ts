// ----------------------------------------------------------------------------
// © 2022 Eungsik Yoon <yoon.eungsik@gmail.com>
// ----------------------------------------------------------------------------

import { Container } from 'typedi';
import { RequestAs, ResponseAs } from '../server/expressEx';
import xlog from '../utils/xlog';
import RedisConnPool from '../redislib/connPool';

interface RequestBody {
  branch: string | undefined;
  user: string;
  files: string[];
}

interface ResponseBody {
  ok: boolean;
  msg: string | undefined;
}

// ----------------------------------------------------------------------------
export = async (req: RequestAs<RequestBody>, res: ResponseAs<ResponseBody>) => {
  const branch = req.body.branch || 'master';
  const userName = req.body.user;
  const filePaths = req.body.files;
  const filePathsJson = JSON.stringify(filePaths);

  const redisConnPool = Container.get(RedisConnPool);
  return redisConnPool['l_unlockFiles'](userName, branch, filePathsJson)
    .then((errMsg) => {
      const bOk: boolean = errMsg ? false : true;
      const resp: ResponseBody = {
        ok: bOk,
        msg: bOk ? undefined : errMsg,
      };

      // xlog.verbose('/unlockFiles resp:', resp);

      if (bOk) {
        for (const filePath of filePaths) {
          xlog.info(`User [${userName}] unlocks file [${filePath}]`);
        }
      } else {
        xlog.warn(`/unlockFiles failed. user: [${userName}], error: ${errMsg}`);
      }

      res.json(resp);
    })
    .catch((err) => {
      xlog.error(
        `/unlockFiles error. user: [${userName}], error: ${err.message}`
      );

      const resp = {
        ok: false,
        msg: err.message,
      };

      res.json(resp);
    });
};
