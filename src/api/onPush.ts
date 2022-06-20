// ----------------------------------------------------------------------------
// © 2022 Eungsik Yoon <yoon.eungsik@gmail.com>
// ----------------------------------------------------------------------------

import { Request, Response } from '../server/expressEx';
import config from 'config';
import xlog from '../utils/xlog';
import * as child_process from 'child_process';

// ----------------------------------------------------------------------------
export = async (_: Request, res: Response) => {
  xlog.verbose('Git push notification received.');

  const fetchCmd = 'git fetch';
  child_process.execSync(fetchCmd, {
    cwd: config.get('repoRoot'),
  });

  res.json();
};
