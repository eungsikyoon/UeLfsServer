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
}

interface ResponseBody {
  ok: boolean;
  msg: string | undefined;
}

// ----------------------------------------------------------------------------
export = async (req: RequestAs<RequestBody>, res: ResponseAs<ResponseBody>) => {
  xlog.debug('[TEMP] /unlockAll req:', req.body);

  const branch = req.body.branch || 'master';
  const userName = req.body.user;

  if (userName === undefined) {
    xlog.warn('/unlockAll with undefined userName');
    res.json({
      ok: false,
      msg: 'No user name.',
    });
    return;
  }

  const redisConnPool = Container.get(RedisConnPool);
  return redisConnPool['l_unlockAll'](userName, branch)
    .then((errMsg) => {
      const bOk: boolean = errMsg ? false : true;
      const resp: ResponseBody = {
        ok: bOk,
        msg: bOk ? undefined : errMsg,
      };

      // xlog.verbose('/unlockAll resp:', resp);

      if (bOk) {
        xlog.info(`User [${userName}] unlocks ALL files.`);
      } else {
        xlog.warn(`/unlockAll failed. user: [${userName}], error: ${errMsg}`);
      }

      res.json(resp);
    })
    .catch((err) => {
      xlog.error(
        `/unlockAll error. user: [${userName}], error: ${err.message}`
      );

      const resp = {
        ok: false,
        msg: err.message,
      };

      res.json(resp);
    });
};
