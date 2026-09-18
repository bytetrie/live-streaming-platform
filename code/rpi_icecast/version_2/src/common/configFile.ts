import { Maybe, Mode, Resolve } from "./interfaces"
import { JackPorts, isJackPorts } from "./jack"
import { InputConnectMap } from "../input/input"
import path from "path"
import fs from "fs"

// TODO: add doc
export interface Config {
    modes: Mode[]
    ports: JackPorts
    hosts: string[]
    maxSamples: number
    connectMap: InputConnectMap
}

// TODO: add doc
export function emptyConfig(): Config {
    return {
        hosts: [],
        modes: [],
        ports: { capture: [], playback: [] },
        maxSamples: 0,
        connectMap: new Map()
    }
}

// TODO: add doc
export function isValidConfig(data: Maybe<Config>): data is Config {
    const casted: Config = data as Config
    const properties: boolean[] = [
        Array.isArray(casted.hosts),
        Array.isArray(casted.modes),
        isJackPorts(casted.ports),
        !isNaN(casted.maxSamples),
        casted.connectMap instanceof Map
    ]
    return !properties.includes(false)
}

// TODO: add doc
export function getConfig(rootDir: string): Promise<Config> {
    return new Promise((resolve: Resolve<Config>): void => {
        const file: string = path.join(rootDir, "config.json")

        fs.exists(file, (exists: boolean): void => {
            if (exists) {
                fs.readFile(file, { encoding: "utf8" }, readFile)
            } else {
                console.log("Existing config not found.")
                resolve(emptyConfig())
            }
        })

        function readFile(
            err: NodeJS.ErrnoException | null,
            data: string
        ): void {
            if (err) {
                console.warn("Config file error.")
                resolve(emptyConfig())
                return
            }

            try {
                const parsed: Maybe<Config> = JSON.parse(data)
                if (isValidConfig(parsed)) {
                    resolve(parsed)
                } else {
                    console.warn("Bad config data.")
                    resolve(emptyConfig())
                }
            } catch {
                console.warn("Config parse error.")
                resolve(emptyConfig())
            }
        }
    })
}
