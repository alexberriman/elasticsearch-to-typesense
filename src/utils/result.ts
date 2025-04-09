export interface Ok<T> {
  ok: true;
  value: T;
  error?: never;
}

export interface Err {
  ok: false;
  error: string;
  value?: never;
}

export type Result<T> = Ok<T> | Err;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = (error: string): Err => ({ ok: false, error });

export const isOk = <T>(result: Result<T>): result is Ok<T> => result.ok;
export const isErr = <T>(result: Result<T>): result is Err => !result.ok;
