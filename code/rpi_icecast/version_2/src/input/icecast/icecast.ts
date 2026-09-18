import { AcceptedOS } from "../../common/interfaces"
import { spawn, exec } from "child_process"
import { noIndent } from "../../common/utils"

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

/**
 * Create the information relating to a specific mount point
 *
 * @param mount location name
 * @param saveDir output audio data to this dir
 * @param connectScript location of the on-connect event script
 * @param disconnectScript location of the on-disconnect event script
 * @returns mount config string
 */
function mountConfig(
    mount: string,
    saveDir: string,
    connectScript: string,
    disconnectScript: string
): string {
    return noIndent(`
    <mount type="normal">
        <mount-name>/${mount}</mount-name>
        <max-listeners>10</max-listeners>
        <max-listener-duration>10</max-listener-duration>
        <dump-file>${saveDir}/${mount}.ogg</dump-file>
        <on-connect>${connectScript}</on-connect>
        <on-disconnect>${disconnectScript}</on-disconnect>
    </mount>
    `)
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

    const mounts = (): string[] => {
        return mountPoints.map((mount: string): string => {
            return mountConfig(
                mount,
                fileSaveDir,
                connectScriptPath,
                disconnectScriptPath
            )
        })
    }

    // TODO: generate xml from JS object

    return noIndent(`
    <icecast>
        <limits>
            <clients>10</clients>
            <sources>1</sources>
            <source-timeout>10</source-timeout>
            <burst-on-connect>1</burst-on-connect>
        </limits>

        <authentication>
            <source-password>${sourcePassword}</source-password>
            <admin-user>admin</admin-user>
            <admin-password>${adminPassword}</admin-password>
        </authentication>

        <hostname>${hostname}</hostname>
        <listen-socket>
            <port>${port}</port>
        </listen-socket>

        <location>Noisecrypt</location>

        <paths>
            <logdir>${logDirectory}</logdir>
            <webroot>${icePath}/web</webroot>
            <adminroot>${icePath}/admin</adminroot>
            <alias source="/" destination="/status.xsl" />
        </paths>

        <logging>
            <accesslog>access.log</accesslog>
            <errorlog>error.log</errorlog>
            <loglevel>3</loglevel> <!-- 4 Debug, 3 Info, 2 Warn, 1 Error -->
        </logging>

        <http-headers>
            <header name="Access-Control-Allow-Origin" value="*" />
        </http-headers>

        ${mounts()}

        <security>
            <chroot>0</chroot>
            <changeowner>
                <user>${user}</user>
            </changeowner>
        </security>
    </icecast>
    `)
}
