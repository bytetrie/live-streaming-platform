import { runJack, JackPorts, getJackPorts } from "./common/jack"
import { getOS, createDirIfNew, debugError, unique } from "./common/utils"
import {
    OS as AnyOS,
    isAcceptedOS,
    Mode,
    Resolve,
    StringObject,
    AcceptedOS
} from "./common/interfaces"
import { homedir, userInfo } from "os"
import path from "path"
import { input, InputConnectMap } from "./input/input"
import {
    prompt,
    CheckboxQuestion,
    Answers,
    InputQuestion,
    ConfirmQuestion,
    NumberQuestion,
    ExpandQuestion,
    ListQuestion
} from "inquirer"
import fs from "fs"
import Choice from "inquirer/lib/objects/choice"
import { Config, getConfig } from "./common/configFile"
import { output } from "./output/output"

// TODO: finish on-event scripts (chmod them)

// TODO: add doc
enum UsePreviousHost {
    accept = "accept",
    edit = "edit",
    new = "new"
}

// TODO: add doc
interface Args {
    p: boolean
    h: boolean
    other: string[]
}

// TODO: add doc
enum ParseState {
    PROMPT = "PROMPT",
    NO_PROMPT = "NO_PROMPT",
    EXIT_BAD = "EXIT_BAD",
    EXIT_OK = "EXIT_OK"
}

// TODO: add doc
export enum FinishState {
    EXIT_BAD_NO_KILL = "EXIT_BAD_NO_KILL",
    EXIT_BAD_KILL = "EXIT_BAD_KILL",
    EXIT_OK = "EXIT_OK"
}

// TODO: add doc
interface ArgsValidation {
    validArgs: StringObject
    argValidator: Args
}

/**
 * Prompt the user to select which services they
 * would like to run: host, input and/or output.
 *
 * @returns Promise with list of selected modes
 */
async function chooseModes(
    previousModes: Mode[],
    availablePorts: JackPorts
): Promise<Mode[]> {
    const modes: string[] = Object.values(Mode)
    const options: CheckboxQuestion = {
        type: "checkbox",
        name: "services",
        message: `Select participation modes to run${
            previousModes.length > 0 ? " (pre-selected previous config)" : ""
        }`,
        choices: modes.reduce<Choice[]>(
            (pre: Choice[], mode: string): Choice[] => {
                const noCapture: boolean =
                    availablePorts.capture.length === 0 && mode === Mode.INPUT

                const noPlayback: boolean =
                    availablePorts.playback.length === 0 && mode === Mode.OUTPUT

                if (noCapture || noPlayback) {
                    return pre
                }

                const m: string = mode.toLowerCase()
                pre.push({
                    name: m,
                    value: mode,
                    short: m,
                    disabled: false,
                    checked: previousModes.includes(mode as Mode)
                })
                return pre
            },
            []
        )
    }

    try {
        const answers: Answers = await prompt(options)
        return answers.services
    } catch (error) {
        if (error.isTtyError) {
            throw Error("Execution environment is non-interactive.")
        } else {
            throw debugError("Mode selection prompt failed.", error)
        }
    }
}

/**
 * Run the user selected services in the order of
 * dependency.
 *
 * @param modes A list of user selected services to run
 * @returns promise
 */
async function runServices(
    rootDir: string,
    OS: AcceptedOS,
    config: Config
): Promise<void> {
    console.log("running services")
    if (config.modes.includes(Mode.HOST)) {
        // TODO: run host
        // TODO: add self to host list
    }

    if (config.modes.includes(Mode.INPUT)) {
        input(
            rootDir,
            OS,
            config.hosts,
            config.ports.capture,
            config.connectMap
        )
    }

    if (config.modes.includes(Mode.OUTPUT)) {
        output(
            rootDir,
            config.hosts,
            config.ports.playback,
            config.connectMap,
            config.maxSamples
        )
    }
}

// TODO: add doc
async function updateSavedUserInput(
    rootDir: string,
    newConfig: Partial<Config>
): Promise<Config> {
    const oldConfig: Config = await getConfig(rootDir)

    return new Promise((resolve: Resolve<Config>): void => {
        const updated: Config = {
            ...oldConfig,
            ...newConfig
        }

        fs.writeFile(
            path.join(rootDir, "config.json"),
            JSON.stringify(updated, null, 4),
            (): void => {
                resolve(updated)
            }
        )
    })
}

// TODO: add doc
function setupDirs(): string {
    const HOME: string = homedir()

    // Ensure the script can write to the HOME directory.
    try {
        fs.accessSync(HOME, fs.constants.W_OK)
    } catch {
        throw Error(
            `Please provide ${
                userInfo().username
            } write permissions to directory: ${HOME}`
        )
    }

    const baseDir: string = createDirIfNew(path.join(homedir(), ".noisecrypt"))
    return createDirIfNew(path.join(baseDir, "v2"))
}

// TODO: add doc
async function askForNewHost(
    options: (InputQuestion | ConfirmQuestion)[],
    hosts: string[]
): Promise<void> {
    try {
        const answers: Answers = await prompt(options)
        if (answers.host !== "") hosts.push(answers.host)

        if (answers.askAgain || hosts.length === 0) {
            await askForNewHost(options, hosts)
        }
    } catch (error) {
        if (error.isTtyError) {
            throw Error("Execution environment is non-interactive.")
        } else {
            throw debugError("Input prompt failed.", error)
        }
    }
}

// TODO: add doc
function addHosts(): Promise<string[]> {
    const options: (InputQuestion | ConfirmQuestion)[] = [
        {
            type: "input",
            name: "host",
            message: "Enter a host location"
        },
        {
            type: "confirm",
            name: "askAgain",
            message: "Add another location?"
        }
    ]

    return new Promise((resolve: Resolve<string[]>): void => {
        const hosts: string[] = []
        askForNewHost(options, hosts)
            .then((): void => resolve(hosts.filter(unique)))
            .catch((): void => resolve([]))
    })
}

// TODO: add doc
async function editHosts(previousHosts: string[]): Promise<string[]> {
    const options: CheckboxQuestion = {
        type: "checkbox",
        name: "deleteHosts",
        message: "Select hosts to remove",
        choices: previousHosts.map(
            (host: string, index: number): Choice => ({
                name: host,
                value: index,
                short: `${index}`,
                disabled: false
            })
        )
    }

    try {
        const answers: Answers = await prompt(options)
        const filteredHosts: string[] = previousHosts.filter(
            (_: string, index: number): boolean =>
                !answers.deleteHosts.includes(index)
        )
        const newHosts: string[] = await addHosts()
        return [...filteredHosts, ...newHosts].filter(unique)
    } catch (error) {
        if (error.isTtyError) {
            throw Error("Execution environment is non-interactive.")
        } else {
            throw debugError("Mode selection prompt failed.", error)
        }
    }
}

// TODO: add doc
async function inputHosts(previousHosts: string[]): Promise<string[]> {
    if (previousHosts.length === 0) {
        return await addHosts()
    }

    const previousOptions: ExpandQuestion = {
        type: "expand",
        name: "previousHosts",
        message: "Use previous hosts?",
        default: 0,
        choices: [
            {
                name: "Accept and continue",
                key: "y",
                short: UsePreviousHost.accept,
                value: UsePreviousHost.accept
            },
            {
                name: "Accept and add/remove hosts",
                key: "e",
                short: UsePreviousHost.edit,
                value: UsePreviousHost.edit
            },
            {
                name: "Set all new hosts",
                key: "n",
                short: UsePreviousHost.new,
                value: UsePreviousHost.new
            }
        ]
    }

    try {
        const answers: Answers = await prompt(previousOptions)
        switch (answers.previousHosts) {
            case UsePreviousHost.accept:
                return previousHosts
            case UsePreviousHost.edit:
                return await editHosts(previousHosts)
            case UsePreviousHost.new:
                return await addHosts()
            default:
                return previousHosts
        }
    } catch (error) {
        if (error.isTtyError) {
            throw Error("Execution environment is non-interactive.")
        } else {
            throw debugError("Host prompt failed.", error)
        }
    }
}

// TODO: add doc
async function inputMaxSamples(previousMaxSamples: number): Promise<number> {
    const options: NumberQuestion = {
        type: "number",
        name: "limit",
        message: `Sample library size limit (0 = no limit), press ENTER to use default ${previousMaxSamples}`,
        default: previousMaxSamples
    }

    try {
        const answers: Answers = await prompt(options)
        return answers.limit
    } catch (error) {
        if (error.isTtyError) {
            throw Error("Execution environment is non-interactive.")
        } else {
            throw debugError("Number prompt failed.", error)
        }
    }
}

// TODO: add doc
function portsToQuestion(
    ports: JackPorts,
    previousPorts: JackPorts,
    type: keyof JackPorts
): CheckboxQuestion {
    return {
        type: "checkbox",
        name: type,
        message: `Select ${type} channels`,
        choices: ports[type].map(
            (port: string, index: number): Choice => ({
                name: port,
                short: `${index}`,
                value: port,
                checked: previousPorts[type].includes(port),
                disabled: false
            })
        ),
        validate: (_: any, answers?: Answers): string | boolean => {
            if (!answers || answers[type].length === 0) {
                return "Select at least 1 port"
            }
            return true
        }
    }
}

// TODO: add doc
async function selectJackPorts(
    modes: Mode[],
    previousPorts: JackPorts,
    currentPorts: JackPorts
): Promise<JackPorts> {
    if (
        currentPorts.capture.length === 0 &&
        currentPorts.playback.length === 0
    ) {
        throw Error("There are no JACK channels")
    }

    const options: CheckboxQuestion[] = []

    if (modes.includes(Mode.INPUT)) {
        options.push(portsToQuestion(currentPorts, previousPorts, "capture"))
    }

    if (modes.includes(Mode.OUTPUT)) {
        options.push(portsToQuestion(currentPorts, previousPorts, "playback"))
    }

    try {
        const answers: Answers = await prompt(options)
        return {
            capture: answers.capture || [],
            playback: answers.playback || []
        }
    } catch (error) {
        if (error.isTtyError) {
            throw Error("Execution environment is non-interactive.")
        } else {
            throw debugError("Port selection prompt failed.", error)
        }
    }
}

// TODO: add doc
function validateArgs(args: string[]): ArgsValidation {
    const validArgs: StringObject = {
        "--previous": "Use previous config without prompts",
        "-p": "alias for: --previous",
        "--help": "Show this help infomation",
        "-h": "alias for: --help"
    }

    const argValidator: Args = args.reduce<Args>(
        (pre: Args, arg: string): Args => {
            switch (arg) {
                case "--previous":
                case "-p":
                    return {
                        ...pre,
                        p: true
                    }
                case "--help":
                case "-h":
                    return {
                        ...pre,
                        h: true
                    }
                default:
                    pre.other.push(arg)
                    return pre
            }
        },
        { p: false, h: false, other: [] }
    )

    return {
        validArgs,
        argValidator
    }
}

// TODO: add doc
function parseArgs(args: string[]): ParseState {
    if (args.length === 0) return ParseState.PROMPT

    const { argValidator, validArgs }: ArgsValidation = validateArgs(args)

    const longest: number = Object.keys(validArgs).reduce(
        (p: number, curr: string): number =>
            curr.length > p ? curr.length : p,
        0
    )

    const padLeft = (arg: string): string =>
        `${" ".repeat(longest - arg.length)}${arg}`

    function printInfo(): void {
        console.log("Noisecrypt v2")
        console.log(
            Object.entries(validArgs)
                .map(([key, value]: [string, string]): string => {
                    return `${padLeft(key)}    ${value}`
                })
                .join("\n")
        )
    }

    if (argValidator.other.length > 0) {
        console.log(
            `"${argValidator.other.join(", ")}": not ${
                argValidator.other.length > 1
                    ? "valid arguments"
                    : "a valid argument"
            }`
        )
        printInfo()
        return ParseState.EXIT_BAD
    } else if (argValidator.h) {
        printInfo()
        return ParseState.EXIT_OK
    } else if (argValidator.p) {
        return ParseState.NO_PROMPT
    } else {
        return ParseState.PROMPT
    }
}

// TODO: add doc
async function selectConnectMap(
    modes: Mode[],
    ports: JackPorts,
    previousConnectMap: InputConnectMap
): Promise<InputConnectMap> {
    // Both input and output modes need to be selected
    if (!(modes.includes(Mode.INPUT) && modes.includes(Mode.OUTPUT))) {
        return new Map()
    }

    const options: ListQuestion[] = ports.capture.map(
        (capture: string): ListQuestion => {
            return {
                type: "list",
                name: capture,
                message: `(optional) Select a playback port to dedicate to input port: ${capture}`,
                choices: ports.playback.map(
                    (port: string, index: number): Choice => ({
                        name: port,
                        short: `${index}`,
                        value: port,
                        checked: previousConnectMap.get(capture) === port,
                        disabled: false
                    })
                )
            }
        }
    )

    try {
        const answers: Answers = await prompt(options)
        return new Map(Object.entries(answers))
    } catch (error) {
        if (error.isTtyError) {
            throw Error("Execution environment is non-interactive.")
        } else {
            throw debugError("Connect map selection prompt failed.", error)
        }
    }
}

/**
 * Main app entry point.
 * Gather's initial user input and intiates all services and dependencies.
 *
 * @returns promise
 */
export async function main(args: string[]): Promise<FinishState> {
    const OS: AnyOS = getOS()
    if (!isAcceptedOS(OS)) {
        throw debugError("OS is not supported.", `OS: ${OS}`)
    }

    const rootDir: string = setupDirs()

    const parseState: ParseState = parseArgs(args)

    if (parseState === ParseState.EXIT_BAD) {
        return FinishState.EXIT_BAD_NO_KILL
    } else if (parseState === ParseState.EXIT_OK) {
        return FinishState.EXIT_OK
    }

    const previousConfig: Config = await getConfig(rootDir)

    await runJack(OS)

    if (parseState === ParseState.NO_PROMPT) {
        await runServices(rootDir, OS, previousConfig)

        return FinishState.EXIT_OK
    }

    const availablePorts: JackPorts = await getJackPorts()

    const modes: Mode[] = await chooseModes(
        previousConfig.modes,
        availablePorts
    )

    const updateModesPromise: Promise<Config> = updateSavedUserInput(rootDir, {
        modes
    })

    const hosts: string[] = await inputHosts(previousConfig.hosts)

    const updateHostsPromise: Promise<Config> = updateModesPromise.then(
        (): Promise<Config> => updateSavedUserInput(rootDir, { hosts })
    )

    const maxSamples: number = await inputMaxSamples(previousConfig.maxSamples)

    const updateMaxSamplesPromise: Promise<Config> = updateHostsPromise.then(
        (): Promise<Config> => updateSavedUserInput(rootDir, { maxSamples })
    )

    const ports: JackPorts = await selectJackPorts(
        modes,
        previousConfig.ports,
        availablePorts
    )

    const updatePortsPromise: Promise<Config> = updateMaxSamplesPromise.then(
        (): Promise<Config> => updateSavedUserInput(rootDir, { ports })
    )

    const connectMap: InputConnectMap = await selectConnectMap(
        modes,
        ports,
        previousConfig.connectMap
    )

    const updateConnectMapPromise: Promise<Config> = updatePortsPromise.then(
        (): Promise<Config> => updateSavedUserInput(rootDir, { connectMap })
    )

    await runServices(rootDir, OS, {
        modes,
        hosts,
        maxSamples,
        ports,
        connectMap
    })

    await updateConnectMapPromise

    return FinishState.EXIT_OK
}
