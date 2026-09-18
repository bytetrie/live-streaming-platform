import { InputConnectMap } from "../input/input"
import sqlite3 from "sqlite3"
import { sampleLibrary } from "./library"
import path from "path"
import { createDirIfNew, randomHash } from "../common/utils"
import { spawn } from "child_process"
import fs from "fs"

// TODO: add doc
interface OutputPaths {
    outputDir: string
    rootDir: string
    libraryDir: string
    dbDir: string
    dbPath: string
    pythonDir: string
    venvPython: string
    pythonScript: string
}

// TODO: add doc
export interface OutputState {
    paths: OutputPaths
    hosts: string[]
    playbackPortNumbers: number[]
    maxSamples: number
}

// TODO: add doc
function getOutputPaths(rootDir: string): OutputPaths {
    const outputDir: string = createDirIfNew(path.join(rootDir, "output"))
    const libraryDir: string = createDirIfNew(
        path.join(rootDir, "output", "library", randomHash())
    )
    const dbDir: string = createDirIfNew(path.join(rootDir, "output", "db"))
    const dbPath: string = path.join(dbDir, "noisecrypt")
    const pythonDir: string = path.resolve(
        path.join(__dirname, "..", "..", "scripts", "pythonPlayer")
    )
    const venvPython: string = path.join(pythonDir, "venv", "bin", "python")
    const pythonScript: string = path.join(pythonDir, "pythonPlayer.py")

    return {
        outputDir,
        rootDir,
        libraryDir,
        dbDir,
        dbPath,
        pythonDir,
        pythonScript,
        venvPython
    }
}

// TODO: add doc
function getOutputState(
    rootDir: string,
    hosts: string[],
    playbackPorts: string[],
    connectMap: InputConnectMap,
    maxSamples: number
): OutputState {
    const usedPorts: string[] = Array.from(connectMap.values())
    const availablePorts: number[] = playbackPorts
        .filter((port: string): boolean => !usedPorts.includes(port))
        .map((port: string): number => parseInt(port.split("_")[1], 10) - 1)

    return {
        paths: getOutputPaths(rootDir),
        hosts,
        playbackPortNumbers: availablePorts,
        maxSamples
    }
}

// TODO: add doc
function initDb(state: OutputState): sqlite3.Database {
    const db: sqlite3.Database = new sqlite3.Database(state.paths.dbPath)

    db.run("DROP TABLE IF EXISTS samples")
    const statement: string = [
        "CREATE TABLE samples(",
        "path TEXT, host TEXT, input TEXT, length INTEGER, ",
        "count INTEGER, added INTEGER, updated INTEGER)"
    ].join("")
    db.run(statement)

    return db
}

// TODO: add doc
function player(state: OutputState): void {
    fs.exists(state.paths.venvPython, (exists: boolean): void => {
        if (!exists) {
            throw Error("Python executable not available, run install script.")
        }

        spawn(
            state.paths.venvPython,
            [
                state.paths.pythonScript,
                "--db",
                state.paths.dbPath,
                "--port",
                state.playbackPortNumbers.join(" ")
            ],
            {
                detached: true,
                stdio: "ignore"
            }
        ).on("error", (): void => {})
    })
}

// TODO: add doc
export async function output(
    rootDir: string,
    hosts: string[],
    playbackPorts: string[],
    connectMap: InputConnectMap,
    maxSamples: number
): Promise<void> {
    const state: OutputState = getOutputState(
        rootDir,
        hosts,
        playbackPorts,
        connectMap,
        maxSamples
    )

    const db: sqlite3.Database = initDb(state)

    sampleLibrary(state, db)
    player(state)
}
