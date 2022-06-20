// ----------------------------------------------------------------------------
// © 2022 Eungsik Yoon <yoon.eungsik@gmail.com>
// ----------------------------------------------------------------------------

import Container from 'typedi';
import { RequestAs, ResponseAs } from '../server/expressEx';
import xlog from '../utils/xlog';
import RedisConnPool from '../redislib/connPool';

interface RequestBody {
  user: string;
  branch: string;
}

interface ResponseBody {
  ok: boolean;
  msg: string | undefined;
  lockedFiles: string[];
}

// ----------------------------------------------------------------------------
export = async (req: RequestAs<RequestBody>, res: ResponseAs<ResponseBody>) => {
  const user: string = req.body.user;
  const branch: string = req.body.branch || 'master';

  const resp: ResponseBody = {
    ok: false,
    msg: null,
    lockedFiles: [],
  };

  if (!user || user.length === 0) {
    resp.ok = false;
    resp.msg = 'Invalid user name!';

    res.json(resp);
    return;
  }

  xlog.info(`User [${user}] login.`);

  const redisConnPool = Container.get(RedisConnPool);
  return redisConnPool['l_loadLockedFilesByUser'](user)
    .then((lockedFilesJson) => {
      resp.ok = true;

      if (lockedFilesJson) {
        const reg = '^' + branch + ':';
        const re = new RegExp(reg, 'g');
        const lockedFiles = JSON.parse(lockedFilesJson);
        for (const filePath of lockedFiles) {
          // skip files which is not lokced in current branch
          if (-1 === filePath.search(reg)) {
            xlog.info('[TEMP] different branch... skipping filePath:', {
              filePath,
            });
            continue;
          }
          // Remove the 'master:' prefix.
          resp.lockedFiles.push(filePath.replace(re, ''));
        }
      }

      xlog.verbose('[TEMP] login resp:', { resp });
      res.json(resp);
    })
    .catch((err) => {
      xlog.error('Unsafe login error', { err: err.message });

      resp.ok = false;
      resp.msg = err.message;

      res.json(resp);
    });
};
