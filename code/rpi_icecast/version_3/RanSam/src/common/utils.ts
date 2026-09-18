import { platform } from "os"
import { OS, Resolve } from "./interfaces"
import { readFileSync, existsSync, mkdirSync } from "fs"
import crypto from "crypto"

/**
 * Find the OS for the current environment.
 *
 * @returns the name of the OS
 */
export function getOS(): OS {
    switch (platform()) {
        case "darwin":
            return "mac"
        case "linux":
            const info: string = readFileSync("/etc/os-release", {
                encoding: "utf8"
            })
            const rgx: RegExpExecArray | null = /ID_LIKE=(\w+)/.exec(info)
            if (rgx && rgx[1] === "debian") return "debian"
        default:
            return "other"
    }
}

/**
 * A token for setting long passwords.
 *
 * @returns a random 48 byte hex string
 */
export function token(): string {
    return crypto.randomBytes(48).toString("hex")
}

/**
 * If a directory doesn't exist, create it.
 *
 * **This doesn't ensure the parent directories also exist,
 * and will fail if not.**
 *
 * @param dirPath location of a directory
 * @returns the location of the provided directory
 */
export function createDirIfNew(dirPath: string): string {
    if (typeof dirPath !== "string") {
        throw Error("Path is not a string.")
    }

    if (!existsSync(dirPath)) {
        mkdirSync(dirPath)
    }

    return dirPath
}

/**
 * Helper for removing the first indent when creating
 * string using template quotes as in functions they
 * are indented for readability within the scope.
 *
 * @param text string to un-indent
 * @returns un-indented string
 */
export function noIndent(text: string): string {
    if (typeof text !== "string") {
        throw Error("Text is not a string.")
    }

    return text.replace(/^ {4}/gm, "")
}

/**
 * Promise wrapper for setTimeout.
 *
 * @param seconds duration for timeout
 * @returns promise
 */
export function sleep(seconds: number): Promise<void> {
    if (isNaN(seconds)) {
        throw Error("Seconds is not a number")
    }

    return new Promise<void>((resolve: Resolve<void>): void => {
        setTimeout(resolve, ~~(seconds * 1000))
    })
}

/**
 * Helper for displaying additional error messages when in debug more.
 *
 * @param message normal message to show to users
 * @param debugMessage additional message to show in debug mode
 * @returns error object with correct message content
 */
export function debugError(message: string, debugMessage?: string): Error {
    return process.env.NODE_ENV === "debug"
        ? Error(`${message}\n${debugMessage}`)
        : Error(message)
}

// TODO: add doc
export function unique<T>(value: T, index: number, self: T[]): boolean {
    return self.indexOf(value) === index
}

// TODO: add doc
export function randomInt(from: number, to: number): number {
    if (from > to) return from
    return ~~(Math.random() * (to - from) + from)
}

// TODO: add doc
export function randomHash(): string {
    return `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(
        /[018]/g,
        (a: string): string =>
            (+a ^ ((crypto.randomBytes(1)[0] * 16) >> (+a / 4))).toString(16)[0]
    )
}
