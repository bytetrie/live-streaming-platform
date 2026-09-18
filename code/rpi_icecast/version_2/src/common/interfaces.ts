export type AcceptedOS = "debian" | "mac"
export type OS = AcceptedOS | "other"

// TODO: add doc
export enum Mode {
    INPUT = "INPUT",
    OUTPUT = "OUTPUT",
    HOST = "HOST"
}

// TODO: add doc
export type Resolve<T> = (value?: T | PromiseLike<T> | undefined) => void

// TODO: add doc
export type Reject = (reason?: any) => void

// TODO: add doc
export type Maybe<T> = T | void

// TODO: add doc
export type ValueOf<T> = T[keyof T]

// TODO: add doc
export type StringObject = { [index: string]: string }

/**
 * Helper to determine if OS value is supported.
 *
 * @param someOS environment operating system
 * @returns boolean, true if OS is AcceptedOS
 */
export function isAcceptedOS(someOS: OS): someOS is AcceptedOS {
    return ["debian", "mac"].includes(someOS)
}
