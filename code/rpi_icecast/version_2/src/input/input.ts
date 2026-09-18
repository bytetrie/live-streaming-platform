import { getIcecastConfig, runIcecast } from "./icecast/icecast"
import { AcceptedOS, Resolve } from "../common/interfaces"
import path from "path"
import os from "os"
import { token, createDirIfNew } from "../common/utils"
import getPort from "get-port"
import fs from "fs"
import { runDarkice, getDarkiceConfig, darkicePortName } from "./darkice"
import { isJackRunning, connectPorts } from "../common/jack"

// TODO: add doc
interface InputPaths {
    inputDir: string
    logDirectory: string
    configDir: string
    iceConfigPath: string
    darkiceConfigPath: string
    rootDir: string
    saveDir: string
    connectScript: string
    disconnectScript: string
}

// TODO: add doc
interface InputState {
    paths: InputPaths
    hostname: string
    icecastPort: number
    user: string
    sourcePassword: string
    adminPassword: string
    OS: AcceptedOS
    hosts: string[]
    capturePorts: string[]
}

// TODO: add doc
export type InputConnectMap = Map<string, string>

/**
 * Create directories (if they don't exist) and construct the
 * paths for all directories and files for the input service.
 *
 * @param rootDir The project version's root directory path
 * @returns paths relating to the input service state
 */
function getInputPaths(rootDir: string): InputPaths {
    const date: string = new Date().toISOString()

    const inputDir: string = createDirIfNew(path.join(rootDir, "input"))
    const logDirectory: string = createDirIfNew(path.join(inputDir, "logs"))
    const configDir: string = createDirIfNew(path.join(inputDir, "config"))
    const saveDir: string = createDirIfNew(path.join(inputDir, `audio_${date}`))
    const iceConfigPath: string = path.join(configDir, "icecast.xml")
    const darkiceConfigPath: string = path.join(configDir, "darkice.cfg")
    const connectScript: string = path.join(
        __dirname,
        "icecast",
        "onConnect.js"
    )
    const disconnectScript: string = path.join(
        __dirname,
        "icecast",
        "onDisconnect.js"
    )

    return {
        inputDir,
        logDirectory,
        configDir,
        iceConfigPath,
        darkiceConfigPath,
        rootDir,
        saveDir,
        connectScript,
        disconnectScript
    }
}

/**
 * Builds the state object required for the input service.
 *
 * @param rootDir the project version root directory
 * @param OS the environment operating system
 * @param hosts a list of hosts to connect to
 * @param capturePorts jack ports to listen to
 * @returns the input service state object
 */
async function getInputState(
    rootDir: string,
    OS: AcceptedOS,
    hosts: string[],
    capturePorts: string[]
): Promise<InputState> {
    const icecastPort: number = await getPort()

    return {
        hostname: os.hostname(),
        icecastPort,
        user: os.userInfo().username,
        sourcePassword: token(),
        adminPassword: token(),
        paths: getInputPaths(rootDir),
        OS,
        hosts,
        capturePorts
    }
}

/**
 * Create consistent naming structure for channels
 *
 * @param channel the capture channel number
 * @returns the channel name
 */
function getChannelName(channel: number): string {
    return `channel_${channel}`
}

/**
 * Build's the icecast config, saves it, then runs
 * the icecast process.
 *
 * @param state input service state object
 */
function startIcecast(state: InputState): void {
    const mounts: string[] = state.capturePorts.map(
        (_: string, i: number): string => getChannelName(i)
    )

    const icecastConfig: string = getIcecastConfig(
        state.hostname,
        state.icecastPort,
        state.paths.logDirectory,
        state.user,
        state.sourcePassword,
        state.adminPassword,
        state.OS,
        mounts,
        state.paths.saveDir,
        state.paths.connectScript,
        state.paths.disconnectScript
    )

    fs.writeFileSync(state.paths.iceConfigPath, icecastConfig)

    runIcecast(state.OS, state.paths.iceConfigPath)
}

/**
 * For each capture port, create a darkice config and run a
 * service that mounts to a specific location in icecast.
 *
 * @param state input service state object
 * @returns promise
 */
async function startDarkice(state: InputState): Promise<void> {
    await Promise.all(
        state.capturePorts.map(
            async (channel: string, index: number): Promise<void> => {
                const mount: string = getChannelName(index)

                const darkiceConfig: string = getDarkiceConfig(
                    mount,
                    state.hostname,
                    state.icecastPort,
                    state.sourcePassword
                )

                fs.writeFileSync(state.paths.darkiceConfigPath, darkiceConfig)

                runDarkice(state.paths.darkiceConfigPath)

                await connectPorts(channel, darkicePortName(mount))
            }
        )
    )
}

// TODO: add doc
async function connectPortsFromMap(map: InputConnectMap): Promise<void> {
    return new Promise(
        async (resolve: Resolve<void>): Promise<void> => {
            const entries: IterableIterator<[string, string]> = map.entries()
            while (true) {
                const entry: IteratorResult<
                    [string, string],
                    any
                > = entries.next()
                const item: [string, string] = entry.value
                await connectPorts(item[0], item[1])
                if (entry.done) break
            }
            resolve()
        }
    )
}

// TODO: review notes re port-forwarding, icecast remote mount

/**
 * Run the input service with the provided settings.
 *
 * @param rootDir project version's root dir
 * @param OS the environment operating system
 * @param hosts a list of hosts to connect to
 * @param capturePorts jack ports to listen to
 * @returns promise
 */
export async function input(
    rootDir: string,
    OS: AcceptedOS,
    hosts: string[],
    capturePorts: string[],
    connectMap: InputConnectMap
): Promise<void> {
    const jackRunning: boolean = await isJackRunning()

    if (!jackRunning) {
        throw Error("Input failed because JACK isn't running.")
    }

    const state: InputState = await getInputState(
        rootDir,
        OS,
        hosts,
        capturePorts
    )

    startIcecast(state)

    await startDarkice(state)

    await connectPortsFromMap(connectMap)
}
