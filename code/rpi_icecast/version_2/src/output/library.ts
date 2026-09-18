import { randomInt, randomHash, debugError } from "../common/utils"
import http from "http"
import { Resolve, Reject } from "../common/interfaces"
import fs from "fs"
import path from "path"
import sqlite3 from "sqlite3"
import { OutputState } from "./output"

// TODO: add doc
function getInputLocation(host: string): Promise<string> {
    return new Promise((resolve: Resolve<string>): void => {
        const data: string[] = []

        const request: http.ClientRequest = http.get(
            host,
            (response: http.IncomingMessage): void => {
                response.setEncoding("utf8")

                response.on("data", (chunk: string): void => {
                    data.push(chunk)
                })

                response.on("end", (): void => {
                    resolve(data.join(""))
                })
            }
        )

        request.on("error", (): void => {
            resolve("")
        })

        request.end()
    })
}

// TODO: add doc
function getAudio(
    inputLocation: string,
    size: number,
    filePath: string
): Promise<string> {
    return new Promise((resolve: Resolve<string>, reject: Reject): void => {
        const file: fs.WriteStream = fs.createWriteStream(filePath)
        let downloaded: number = 0
        const request: http.ClientRequest = http.get(
            inputLocation,
            (response: http.IncomingMessage): void => {
                response.pipe(file)
                response.on("data", (chunk: any): void => {
                    downloaded += chunk.length
                    if (downloaded >= size) request.end()
                })
                file.on("finish", (): void => {
                    file.close()
                    resolve(filePath)
                })
            }
        )

        request.on("error", (error: Error): void => {
            file.close()
            file.destroy()
            reject(error)
        })
    })
}

// TODO: add doc
function updateDatabase(
    filePath: string,
    host: string,
    inputLocation: string,
    db: sqlite3.Database,
    length: number
): void {
    const now: number = Date.now()
    const statement: string = [
        "INSERT INTO samples values(",
        `"${filePath}", "${host}", "${inputLocation}", `,
        `${length}, 0, ${now}, ${now})`
    ].join("")
    db.run(statement)
}

// TODO: add doc
async function getSample(
    filePath: string,
    hosts: string[],
    db: sqlite3.Database
): Promise<void> {
    const index: number = randomInt(0, hosts.length)
    const host: string = hosts[index]

    const inputLocation: string | undefined = await getInputLocation(host)

    if (!inputLocation) return

    const seconds: number = randomInt(1, 11)
    // at 64kbps it's 8 KB per second
    const size: number = 1024 * 8 * seconds
    // From what I understand, around every 4-8KBs there's a 27B header
    // see: https://en.wikipedia.org/wiki/Ogg_page
    const sizeOffset: number = ~((size / (4 * 1024)) * 27) + size
    try {
        await getAudio(inputLocation, sizeOffset, filePath)

        updateDatabase(filePath, host, inputLocation, db, seconds)
    } catch (error) {
        throw debugError(
            `Data from input: ${inputLocation} from host: ${host} failed to download.`,
            error.message
        )
    }
}

// TODO: add doc
export function sampleLibrary(
    { paths, maxSamples, hosts }: OutputState,
    db: sqlite3.Database
): void {
    const samplesCounter: { [index: string]: boolean } = {}

    const interval: NodeJS.Timeout = setInterval((): void => {
        const name: string = `${randomHash()}.ogg`
        const onSuccess: () => void = updateCount(name)
        getSample(path.join(paths.libraryDir, name), hosts, db)
            .then(onSuccess)
            .catch((error: Error): void => {
                console.warn(error.message)
            })
    }, 5000)

    function updateCount(name: string): () => void {
        if (maxSamples === 0) return (): void => {}

        samplesCounter[name] = false

        return (): void => {
            samplesCounter[name] = true
            const count: boolean[] = Object.values(samplesCounter).filter(
                (s: boolean): boolean => s
            )
            if (count.length >= maxSamples) {
                clearInterval(interval)
            }
        }
    }
}
