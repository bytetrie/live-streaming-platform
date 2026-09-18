// Run host service
// -   [ ] make popping list of randomised urls to ensure consistency
// -   [ ] log everything
// -   [ ] custom port, set request URLS and address (config file etc)
// server users sqlite3
// use native server modules
// if required, use unix socket
// TODO: get to retrieve a url
// TODO: post to add a url
// TODO: delete to remove a url

import { createServer, Server, IncomingMessage, ServerResponse } from "http"
import getPort from "get-port"
import { Resolve, Reject } from "../common/interfaces"

function collectRequestData(request: IncomingMessage): Promise<string> {
    return new Promise((resolve: Resolve<string>, reject: Reject): void => {
        const { headers }: IncomingMessage = request
        const type: string = headers["content-type"] || ""
        const size: number = parseInt(headers["content-length"] || "101", 10)
        let downloaded: number = 0

        if (headers["content-type"] !== "text/plain") {
            reject(`Incorrect content type ${type}`)
        } else if (size > 100) {
            reject("Too much data")
        } else {
            const data: any[] = []
            request.on("data", (chunk: any): void => {
                downloaded += chunk.length
                data.push(chunk)
                if (downloaded > 100) {
                    request.destroy(Error("Too much data"))
                    reject("Too much data")
                }
            })
            request.on("end", (): void => {
                try {
                    const url: string = data.join("")
                    resolve(url)
                } catch (error) {
                    reject("Error parsing data")
                }
            })
        }
    })
}

function requestListener(
    request: IncomingMessage,
    response: ServerResponse
): void {
    // TODO: if request not for root, reject
    const { url, method, read }: IncomingMessage = request
    if (url)
        switch (method) {
            case "GET":
                response.writeHead(200, { "Content-Type": "text/plain" })
                response.write("<a url>")
                response.end()
            case "POST":
                collectRequestData(request)
                    // http://<location>:<port>/status-json.xsl
                    // e.g. http://uk3.internet-radio.com:8405/status-json.xsl
                    // parse for icestats.source.filter -> listenurl === url
                    // if not true or request fails, put "warning" on url
                    // 2 warnings == block
                    .then((url: string):  => {})
                    .catch(() => {})
            case "DELETE":
            default:
                response.statusCode = 405
                response.statusMessage = `${request.method}`
                response.end()
        }
}

// TODO: add doc
export async function host(): Promise<void> {
    const server: Server = createServer(requestListener)

    const port: number = await getPort()

    server.listen(port, "127.0.0.1")
}
