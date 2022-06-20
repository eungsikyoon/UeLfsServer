// ----------------------------------------------------------------------------
// © 2022 Eungsik Yoon <yoon.eungsik@gmail.com>
// ----------------------------------------------------------------------------

import express from 'express';

export interface RequestAs<T> extends express.Request {
  body: T;
}

export interface Request extends express.Request {}
export interface Response extends express.Response {}
export interface ResponseAs<T> extends express.Response {
  json: (body?: T) => this;
}
