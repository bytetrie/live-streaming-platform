function getToggle(): () => boolean {
    const state: {running: boolean, count: number, interval: number} = {
        running: false,
        count: 0,
        interval: 0
    }
    const synth: SpeechSynthesis = window.speechSynthesis

    return (): boolean => {
        if (state.running) {
            synth.pause()
            state.running = false
            clearInterval(state.interval)
            return state.running
        } else {
            if (synth.paused) synth.resume()
            state.running = true
            state.interval = setInterval((): void => {
                if (!synth.speaking && !synth.pending && state.running) {
                    synth.speak(new SpeechSynthesisUtterance(`${state.count}`))
                    state.count += 1
                }
            }, 500)
            return state.running
        }
    }
}

((): void => {
    const btn: HTMLButtonElement = document.createElement("button")
    btn.textContent = "start"
    const toggleApp: () => boolean = getToggle()
    btn.addEventListener("click", (): void => {
        if (toggleApp()) btn.textContent = "stop"
        else btn.textContent = "start"
        btn.classList.toggle("active")
    })
    document.body.appendChild(btn)
})()