import { spawn, exec } from "child_process"
import { noIndent } from "../common/utils"

/**
 * End all darkice processes
 *
 * This function is called when the program ends prematurely or
 * via executing the `kill_noisecrypt` command.
 */
export function killDarkice(): void {
    exec("killall darkice")
}

/**
 * Run darkice in a detached process.
 *
 * **This process will not end when the main program completes normally.**
 *
 * If the program quits early, these processes should be killed automatically.
 * Otherwise, the command `kill_noisecrypt` should kill them.
 *
 * @param configPath the darkice config file path
 */
export function runDarkice(configPath: string): void {
    spawn(`darkice`, ["-c", configPath], {
        detached: true,
        stdio: "ignore"
    }).on("error", (): void => {})
}

/**
 * Create a consistent naming structure for darkice ports
 *
 * @param suffix channel suffix to differentiate darkice service ports
 * @returns returns the darkice jack port string
 */
export function darkicePortName(suffix: string): string {
    return `darkice_${suffix}:mono`
}

/**
 * Create a darkice config for the provided icecast data
 *
 * NOTE: Duration 0 means "forever"
 *
 * @param mountPoint icecast mount path for this service
 * @param hostname icecast hostname location
 * @param port icecast port
 * @param sourcePassword icecast source password
 * @returns darkice service config string
 */
export function getDarkiceConfig(
    mountPoint: string,
    hostname: string,
    port: number,
    sourcePassword: string
): string {
    // TODO: generate toml from JS object

    return noIndent(`
    [general]
    duration        = 0
    bufferSecs      = 5
    reconnect       = yes
    realtime        = yes
    rtprio          = 90

    [input]
    device          = jack
    sampleRate      = 44100
    bitsPerSample   = 16
    channel         = 1
    jackClientName  = darkice_${mountPoint}

    [icecast2-0]
    bitrateMode     = vbr       
    format          = vorbis
    bitrate         = 64        
    quality         = 0.1
    server          = ${hostname}
    port            = ${port}
    password        = ${sourcePassword}
    mountPoint      = ${mountPoint}
    `)
}
