#!/usr/bin/env node

import { main, FinishState } from "./main"
import { spawn } from "child_process"
import process from "process"
import path from "path"

// TODO: add doc
export type EndEvent = NodeJS.Signals | "uncaughtException"

/**
 * Ensure all running processes are killed in case
 * of a premature exit.
 */
function exitHandler(): void {
    console.log("Cleaning up.")
    const killPath: string = path.join(__dirname, "kill_noisecrypt.js")
    spawn(`node`, [killPath], {
        detached: true,
        stdio: "ignore"
    }).on("error", (): void => {})
}

process.stdin.resume()
;(process as NodeJS.EventEmitter).on("exit", (exitCode: number): void => {
    if (exitCode !== 0) {
        console.warn("Program exited early.")
        if (exitCode === 1) exitHandler()
    }
})
;([
    "SIGINT",
    "SIGTERM",
    "SIGUSR1",
    "SIGUSR2",
    "uncaughtException"
] as EndEvent[]).map((event: EndEvent): void => {
    ;(process as NodeJS.EventEmitter).on(event, (): void => {
        process.exit(1)
    })
})

main(process.argv.slice(2))
    .then((res: FinishState): void => {
        switch (res) {
            case FinishState.EXIT_BAD_KILL:
                process.exit(1)
            case FinishState.EXIT_BAD_NO_KILL:
                process.exit(2)
            default:
                process.exit(0)
        }
    })
    .catch((error: string): void => {
        console.error(error)
        process.exit(1)
    })
