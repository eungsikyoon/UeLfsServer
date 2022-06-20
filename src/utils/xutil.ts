// ----------------------------------------------------------------------------
// © 2022 Eungsik Yoon <yoon.eungsik@gmail.com>
// ----------------------------------------------------------------------------

import fs from 'fs';
import { promisify } from 'util';

// ----------------------------------------------------------------------------
// Promisified functions.
// ----------------------------------------------------------------------------

export const readdir = promisify(fs.readdir);
export const stat = promisify(fs.stat);
export const readFile = promisify(fs.readFile);
export const sleep = promisify(setTimeout);

// ----------------------------------------------------------------------------
// Date, time, etc.
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
export const dateToUtc = (d: Date): number => {
  return Math.floor(d.getTime() / 1000);
};

// ----------------------------------------------------------------------------
export const curTimeUtc = (): number => {
  const d = new Date();
  return dateToUtc(d);
};

