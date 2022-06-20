// ----------------------------------------------------------------------------
// © 2022 Eungsik Yoon <yoon.eungsik@gmail.com>
// ----------------------------------------------------------------------------

import 'reflect-metadata';
import config from 'config';
import xlog from '../utils/xlog';
import * as server from './server';

xlog.verbose('Config:', config);

// Start server.
server.start();

['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGQUIT'].forEach((signal: NodeJS.Signals) => {
  process.on(signal, server.stop);
});
