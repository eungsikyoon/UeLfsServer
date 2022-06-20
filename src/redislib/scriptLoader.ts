// ----------------------------------------------------------------------------
// © 2022 Eungsik Yoon <yoon.eungsik@gmail.com>
// ----------------------------------------------------------------------------

import path from 'path';

import * as xutil from '../utils/xutil';
import xlog from '../utils/xlog';

// For replication.
const scriptPrefix = 'redis.replicate_commands()\n';

// ----------------------------------------------------------------------------
// Load redis lua scripts.
//
// scripts = {
//   functionName: {
//     fileName: 'foo.lua',
//     content: '...'
//   },
//   .
//   .
// }
// ----------------------------------------------------------------------------

export const loadDir = () => {
  const scripts = {};
  const dirPath = path.join(__dirname, '..', '..', 'redis_script');

  return xutil
    .readdir(dirPath)
    .then((files) => {
      return files.filter((fileName) => {
        return path.extname(fileName) === '.lua';
      });
    })
    .then((luaFiles) => {
      return Promise.all(
        luaFiles.map((luaFile) => {
          const elem: any = {};
          elem.fileName = luaFile;
          const filePath = path.join(dirPath, luaFile);

          xlog.debug('Loading redis Lua script ...', { script: filePath });
          return xutil.readFile(filePath, 'utf8').then((content) => {
            elem.content = scriptPrefix + content;
            scripts[path.basename(luaFile, '.lua')] = elem;
          });
        })
      );
    })
    .then(() => {
      // xlog.debug('scripts loaded:', { scripts });
      return scripts;
    });
};
