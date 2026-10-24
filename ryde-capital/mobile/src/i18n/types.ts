import { en } from './en';

type DeepStringify<T> = T extends (...args: infer P) => infer R
  ? (...args: P) => DeepStringify<R>
  : T extends object
  ? { [K in keyof T]: DeepStringify<T[K]> }
  : string;

export type TranslationSchema = DeepStringify<typeof en>;
