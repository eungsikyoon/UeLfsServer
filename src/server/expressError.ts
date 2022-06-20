// ----------------------------------------------------------------------------
// © 2022 Eungsik Yoon <yoon.eungsik@gmail.com>
// ----------------------------------------------------------------------------

import xlog from '../utils/xlog';

// ----------------------------------------------------------------------------
export const middleware = (err, _req, res, _next) => {
  xlog.warn(`api [${_req.url}] error`);

  if (err.stack) {
    xlog.error('[DEV STACK DUMP]', { stack: err.stack });
  }

  const error = typeof err === 'string' ? err : err.message;
  res.json({
    error,
  });
};
