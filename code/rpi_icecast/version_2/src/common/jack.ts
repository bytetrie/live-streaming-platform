import { exec, spawn, ExecException } from "child_process"
import { AcceptedOS, Resolve, Reject, Maybe } from "./interfaces"
import { env } from "process"

// TODO: add doc
export interface JackPorts {
    capture: string[]
    playback: string[]
}

// TODO: add doc
export function isJackPorts(ports: Maybe<JackPorts>): ports is JackPorts {
    const casted: JackPorts = ports as JackPorts
    const properties: boolean[] = [
        Array.isArray(casted.capture),
        Array.isArray(casted.playback)
    ]
    return !properties.includes(false)
}

/**
 * Helper for retrieving the list of jack ports.
 *
 * @returns promise with array of jack port names
 */
export function getAllPorts(): Promise<string[]> {
    return new Promise<string[]>(
        (resolve: Resolve<string[]>, reject: Reject): void => {
            exec(
                "jack_lsp",
                (err: ExecException | null, stdout: string): void => {
                    if (err) {
                        reject()
                        return
                    }

                    resolve(stdout.split("\n"))
                }
            ).on("exit", (code: number | null): void => {
                if (code === 1) {
                    reject()
                }
            })
        }
    )
}

/**
 * Helper for determining if jack is running.
 *
 * @returns promise with boolean, true if running
 */
export async function isJackRunning(): Promise<boolean> {
    try {
        await getAllPorts()
        return true
    } catch {
        return false
    }
}

/**
 * Get the system playback and capture jack ports
 *
 * @returns promise containing capture and playback port lists
 */
export async function getJackPorts(): Promise<JackPorts> {
    const channels: JackPorts = {
        capture: [],
        playback: []
    }

    try {
        const ports: string[] = await getAllPorts()

        return ports.reduce(
            (previousValue: JackPorts, currentValue: string): JackPorts => {
                if (currentValue.includes("system:capture")) {
                    previousValue.capture.push(currentValue)
                } else if (currentValue.includes("system:playback")) {
                    previousValue.playback.push(currentValue)
                }
                return previousValue
            },
            channels
        )
    } catch {
        return channels
    }
}

/**
 * Helper for determining if a port is a valid jack port
 *
 * @param port jack port name
 * @returns promise with boolean, true if valid port
 */
export async function isPort(port: string): Promise<boolean> {
    try {
        const ports: JackPorts = await getJackPorts()
        return ports.capture.includes(port) || ports.playback.includes(port)
    } catch {
        return false
    }
}

/**
 * Connects to jack ports, if they are valid
 *
 * @param fromPort name of the port sending
 * @param toPort name of the port receiving
 * @returns promise
 */
export async function connectPorts(
    fromPort: string,
    toPort: string
): Promise<void> {
    const running: boolean = await isJackRunning()

    if (!running) {
        console.warn("Can't connect ports, JACK isn't running.")
        return
    }

    const validInPort: boolean = await isPort(fromPort)

    if (!validInPort) {
        throw Error(`${fromPort} is not a valid port.`)
    }

    const validOutPort: boolean = await isPort(toPort)

    if (!validOutPort) {
        throw Error(`${toPort} is not a valid port.`)
    }

    spawn("jack_connect", [fromPort, toPort], {
        detached: true,
        stdio: "ignore"
    }).on("error", (): void => {
        throw Error("Jack connect failed.")
    })
}

/**
 * End jack process
 *
 * This function is called when the program ends prematurely or
 * via executing the `kill_noisecrypt` command.
 */
export function killJack(): void {
    exec("killall jackd")
}

/**
 * Run jack in a detached process.
 *
 * **This process will not end when the main program completes normally.**
 *
 * If the program quits early, these processes should be killed automatically.
 * Otherwise, the command `kill_noisecrypt` should kill them.
 *
 * @param OS environment operating system
 */
export async function runJack(OS: AcceptedOS): Promise<void> {
    const running: boolean = await isJackRunning()

    if (running) {
        console.warn("Can't start JACK, it's already running.")
        return
    }

    const cmd: string = "jackd"
    const args: string[] = []

    switch (OS) {
        case "debian":
            env.JACK_NO_AUDIO_RESERVATION = "1"
            env.PA_ALSA_PLUGHW = "1"

            args.push("-dalsa")
            args.push("-dhw:1")
            args.push("-n3")

        case "mac":
            args.push("-dcoreaudio")
    }

    spawn(cmd, [...args, "-r44100", "-p8192"], {
        detached: true,
        stdio: "ignore"
    }).on("error", (): void => {})
}
