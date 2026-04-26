// Minimal Node type stubs for TS in this repo.
// This exists to satisfy builds that reference the "node" type library
// when @types/node isn't installed/available in the environment.

declare const process: any;
declare const Buffer: any;
declare function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): any;
declare class TextEncoder {
  encode(input?: string): Uint8Array;
}

