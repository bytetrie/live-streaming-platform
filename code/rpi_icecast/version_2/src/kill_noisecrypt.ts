#!/usr/bin/env node

import { killIcecast } from "./input/icecast/icecast"
import { getOS, debugError } from "./common/utils"
import { OS as AnyOS, isAcceptedOS } from "./common/interfaces"
import { killDarkice } from "./input/darkice"
import { killJack } from "./common/jack"

const OS: AnyOS = getOS()
if (!isAcceptedOS(OS)) {
    throw debugError("OS is not supported.", `OS: ${OS}`)
}

killDarkice()

killJack()

killIcecast(OS)

// TODO: add output table to stats file
