import { AcceptedOS } from "../common/interfaces"
import { spawn, exec } from "child_process"
import { transform, AnyObject } from "o2xml"

/**
 * Get the correct icecast command name, as this
 * differs depending on the OS. Should be correct
 * if installed normally.
 *
 * @param OS environment operating system
 * @returns icecast name
 */
function whichIce(OS: AcceptedOS): string {
    return OS === "debian" ? "icecast2" : "icecast"
}

/**
 * End the icecast process
 *
 * This function is called when the program ends prematurely or
 * via executing the `kill_noisecrypt` command.
 */
export function killIcecast(OS: AcceptedOS): void {
    exec(`killall ${whichIce(OS)}`)
}

/**
 * Run icecast in a detached process.
 *
 * **This process will not end when the main program completes normally.**
 *
 * If the program quits early, these processes should be killed automatically.
 * Otherwise, the command `kill_noisecrypt` should kill them.
 *
 * @param OS environment operating system
 * @param configPath the icecast config file path
 */
export function runIcecast(OS: AcceptedOS, configPath: string): void {
    // TODO: ensure icecast isn't already running?
    spawn(whichIce(OS), ["-b", "-c", configPath], {
        detached: true,
        stdio: "ignore"
    }).on("error", (): void => {})
}

/**
 * Path differs depending on the environment, these values
 * should be correct if installed normally.
 *
 * @param OS environment operating system
 * @returns icecast share directory
 */
function getIcecastPath(OS: AcceptedOS): string {
    switch (OS) {
        case "debian":
            return "/usr/share/icecast2"
        case "mac":
            return "/usr/local/share/icecast"
    }
}

// mount = auto gen random value
// saveDir = iceman save dir
// scripts = script location
// maxListeners = 50
// maxDur = 10
// password = random gen
/**
 * Create the information relating to a specific mount point
 *
 * @param mount location name
 * @param saveDir output audio data to this dir
 * @param connectScript location of the on-connect event script
 * @param disconnectScript location of the on-disconnect event script
 * @returns mount config string
 */
function getMountConfigs(
    mount: string,
    saveDir: string,
    connectScript: string,
    disconnectScript: string,
    maxListeners: number,
    maxListenerDuration: number,
    password: string
): AnyObject {
    return {
        "@type": "normal",
        "mount-name": `/${mount}`,
        "max-listeners": maxListeners,
        "max-listener-duration": maxListenerDuration,
        "dump-file": `${saveDir}/${mount}.ogg`,
        hidden: 1,
        password
    }

    // -   authentication
}

// maxTotalClients = 250
// maxSources = 50
// sourceTimeout = 5
function getLimitsConfig(
    maxTotalClients: number,
    maxSources: number,
    sourceTimeout: number
): AnyObject {
    return {
        clients: maxTotalClients,
        sources: maxSources,
        "source-timeout": sourceTimeout
    }
}

// source pass (unused, must be long)
// user = admin
// pass = must be long
function getAuthConfig(
    sourcePass: string,
    user: string,
    pass: string
): AnyObject {
    return {
        "source-password": sourcePass,
        "admin-user": user,
        "admin-password": pass
    }
}

// port = 2845
// ssl = true
function getListenConfig(port: number, ssl: boolean): AnyObject {
    return {
        port,
        ssl: +ssl
    }
}

// logDir = iceman logs
// webFilesPath = os icepath / web
// adminFilesPath = os icepath / admin
function getPathsConfig(
    logDir: string,
    webFilesPath: string,
    adminFilesPath: string,
    sslCertPath: string,
    pidFilePath: string
): AnyObject {
    return {
        logdir: logDir,
        webroot: webFilesPath,
        adminroot: adminFilesPath,
        "ssl-certificate": sslCertPath,
        pidfile: pidFilePath
    }
}

// logLevel = 3
// 4 Debug, 3 Info, 2 Warn, 1 Error
function getLogsConfig(logLevel: 1 | 2 | 3 | 4): AnyObject {
    return {
        accesslog: "access.log",
        errorlog: "error.log",
        loglevel: logLevel
    }
}

// permissionsUser = current user
function getSecurityConfig(permissionsUser: string): AnyObject {
    return {
        chroot: 0,
        changeowner: {
            user: permissionsUser
        }
    }
}

/**
 * Creates the config for the icecast service
 *
 * @param hostname hostname where icecast will run
 * @param port port where icecast will run
 * @param logDirectory location of the log files for icecast
 * @param user the user for the icecast service
 * @param sourcePassword password for mounting source stream
 * @param adminPassword password for accessing icecast admin
 * @param OS environment operating system
 * @param mountPoints list of mount names
 * @param fileSaveDir location for outputting audio files
 * @param connectScriptPath location for the on-connect event script
 * @param disconnectScriptPath location for the on-disconnect event script
 * @returns icecast config string
 */
export function getIcecastConfig(
    hostname: string,
    port: number,
    logDirectory: string,
    user: string,
    sourcePassword: string,
    adminPassword: string,
    OS: AcceptedOS,
    mountPoints: string[],
    fileSaveDir: string,
    connectScriptPath: string,
    disconnectScriptPath: string
): string {
    const icePath: string = getIcecastPath(OS)

    // TODO: generate xml from JS object
    const object: AnyObject = {
        icecast: {
            limits: getLimitsConfig(maxTotalClients, maxSources, sourceTimeout),
            authentication: getAuthConfig(
                sourcePassword,
                adminUser,
                adminPassword
            ),
            hostname,
            location,
            admin: email,
            "listen-socket": getListenConfig(port, ssl),
            paths: getPathsConfig(
                logDir,
                webFilesPath,
                adminFilesPath,
                sslCertPath,
                pidFilePath
            ),
            logging: getLogsConfig(logLevel),
            "http-headers": {
                header: {
                    "@name": "Access-Control-Allow-Origin",
                    "@value": "*"
                }
            },
            security: getSecurityConfig(permissionsUser),
            mount: mountPoints.map((mount) =>
                getMountConfigs(
                    mount.id,
                    saveDir,
                    connectScriptPath,
                    disconnectScriptPath,
                    maxListeners,
                    maxListenerDuration,
                    mount.password
                )
            )
        }
    }

    return transform(object, { indent: "    ", pretty: true })
}
