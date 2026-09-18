import 'whatwg-fetch'
import Recorder from './recorder'
import build2DUI from './browser2DUI'

(() => {

    /**
     * Verify the app will work
     */

    const AudioContext = window.AudioContext // Default
        || window.webkitAudioContext // Safari and old versions of Chrome
        || false
    if(!AudioContext) {
        document.querySelector("html").className = ""
        console.log("No audio context...")
        return
    }

    /**
     * Build 2D UI
     */
    build2DUI()

    /**
     * Audio setup
     */

    const audioCtx = new AudioContext()
    let masterSource = [], masterSourceIndex = 0, masterBuffer, masterFile, recordingFile, recordingSource,
        lastUpdated, submissionsCount = 0, masterPlayState = false, recordingPlayState = false, autoReloadMaster = false


    /**
     * Messages (success/error/other)
     */

    const messagesWrap = document.querySelector("#messagesWrap")
    const messages = document.querySelector("#messages")
    const messagesClose = document.querySelector("#messagesClose")

    const displayMessage = (message) => {
        messages.innerHTML = message
        messagesWrap.className = messagesWrap.className.replace(/closed/g, "")
    }

    messagesClose.addEventListener("click", () => {
        messagesWrap.className = messagesWrap.className + " closed"
        messages.innerHTML = ""
    })

    const checkStatus = (response) => {
        if (response.status >= 200 && response.status < 300) {
            return response
        } else {
            const error = new Error(response.statusText)
            error.response = response
            throw error
        }
    }


    /**
     * Generic Binary to Buffer conversion
     * @param file - blob
     * @param done - cb holding buffer
     */

    const getBufferFromAudio = (file, done) => {
        if(!file)
            return
        const myReader = new FileReader()
        myReader.readAsArrayBuffer(file)
        myReader.addEventListener("loadend", (e) => {
            audioCtx.decodeAudioData(e.target.result, done) // Can't use promises in safari
        })
    }


    /**
     * Playing Master Audio
     */

    const reloadMaster = document.querySelector("#reloadMaster")
    const masterBtnIcon = document.querySelector("#masterBtnIcon")
    const toggleMaster = document.querySelector("#toggleMaster")

    const fetchMasterAudio = (done) => {
        fetch("/api/master.wav")
            .then(checkStatus)
            .then((response) => response.blob())
            .then((blob) => {
                masterFile = blob
                if(!autoReloadMaster) {
                    reloadMaster.className = reloadMaster.className.replace(/reloadable/g, "")
                    reloadMaster.setAttribute("disabled", "disabled")
                }
                if(done) done()
            })
            .catch(function() {
                displayMessage("Could not load audio.")
            })
    }

    const playMasterAudio = (buffer) => {
        stopRecordingAudio()
        if(masterSource[masterSourceIndex]) {
            masterSource[masterSourceIndex].stop(audioCtx.currentTime + 5)
            masterSource[masterSourceIndex] = null
        }
        masterBuffer = buffer
        masterSourceIndex = ~masterSourceIndex
        masterSource[masterSourceIndex] = audioCtx.createBufferSource()
        masterSource[masterSourceIndex].connect(audioCtx.destination)
        masterSource[masterSourceIndex].buffer = masterBuffer
        masterSource[masterSourceIndex].loop = true
        masterSource[masterSourceIndex].start(0)
        if(!masterPlayState) {
            const newClass = masterBtnIcon.className.replace(/playBtn/g, "")
            masterBtnIcon.className = newClass + " pauseBtn"
            masterPlayState = true
        }
    }

    const stopMasterAudio = () => {
        if(!masterSource[masterSourceIndex])
            return
        masterSource[masterSourceIndex].stop()
        masterSource[masterSourceIndex] = null
        const newClass = masterBtnIcon.className.replace(/pauseBtn/g, "")
        masterBtnIcon.className = newClass + " playBtn"
        masterPlayState = false
    }

    const toggleMasterAudio = () => {
        if(masterPlayState)
            stopMasterAudio()
        else
            getBufferFromAudio(masterFile, playMasterAudio)
    }

    toggleMaster.addEventListener("click", () => {
        if(masterFile)
            return toggleMasterAudio()
        fetchMasterAudio(toggleMasterAudio)
    })


    /**
     * Check updated master + reload
     */

    const reloadBtnIcon = document.querySelector("#reloadBtnIcon")
    const autoReloadBtn = document.querySelector("#autoReloadCheck")
    const submissions = document.querySelector("#submissions")

    const checkMasterUpdate = () => {
        fetch("/api/update")
            .then((response) => {
                return response.json()
            })
            .then((update) => {
                if (update.submissions && update.submissions !== submissionsCount)
                    submissions.innerHTML = submissionsCount = update.submissions
                if(lastUpdated && update.lastUpdated !== lastUpdated) {
                    if(autoReloadMaster) {
                        fetchMasterAudio(() => {
                            if(masterSource[masterSourceIndex])
                                getBufferFromAudio(masterFile, playMasterAudio)
                        })
                    } else {
                        reloadMaster.className = reloadMaster.className + " reloadable"
                        reloadMaster.removeAttribute("disabled")
                    }
                }
                lastUpdated = update.lastUpdated
            })
    }
    checkMasterUpdate()
    setInterval(checkMasterUpdate, 10000)

    reloadMaster.addEventListener("click", (e) => {
        e.preventDefault()
        fetchMasterAudio(() => {
            if(masterSource[masterSourceIndex])
                getBufferFromAudio(masterFile, playMasterAudio)
        })
    })

    autoReloadBtn.addEventListener('change', (e) => {
        e.preventDefault()
        if(autoReloadBtn.checked) {
            autoReloadMaster = true
            reloadMaster.className = reloadMaster.className.replace(/manual/g, "auto")
        } else {
            autoReloadMaster = false
            reloadMaster.className = reloadMaster.className.replace(/auto/g, "manual")
        }
    })


    /**
     * Playing User Audio
     */

    const recorder = new Recorder(audioCtx, {numChannels: 1})
    const recordingBtnIcon = document.querySelector("#recordingBtnIcon")
    const toggleRecording = document.querySelector("#toggleRecording")

    const playRecordingAudio = (buffer) => {
        stopMasterAudio()
        recordingSource = audioCtx.createBufferSource()
        recordingSource.connect(audioCtx.destination)
        recordingSource.buffer = buffer
        recordingSource.loop = true
        recordingSource.start(0)
        const newClass = recordingBtnIcon.className.replace(/playBtn/g, "")
        recordingBtnIcon.className = newClass + "pauseBtn"
        recordingPlayState = true
    }

    function stopRecordingAudio() {
        if(!recordingSource)
            return
        recordingSource.stop()
        recordingSource = null
        const newClass = recordingBtnIcon.className.replace(/pauseBtn/g, "")
        recordingBtnIcon.className = newClass + "playBtn"
        recordingPlayState = false
    }

    const toggleRecordingAudio = () => {
        if(recordingPlayState)
            stopRecordingAudio()
        else
            getBufferFromAudio(recordingFile, playRecordingAudio)
    }

    toggleRecording.addEventListener("click", toggleRecordingAudio)


    /**
     * Toggle file upload mode
     */


    const fileUploadCheck = document.querySelector("#fileUploadCheck")
    const recordBtnWrap = document.querySelector(".recordBtnWrap")
    const fileUploadWrap = document.querySelector(".fileUploadWrap")
    let fileUpload = false, inputFile = false

    fileUploadCheck.addEventListener('change', (e) => {
        console.log("event")
        e.preventDefault()
        if(inputFile)
            removeFileUpload()
        if(fileUploadCheck.checked) {
            fileUpload = true
            recordBtnWrap.className = recordBtnWrap.className + " hidden"
            fileUploadWrap.className = fileUploadWrap.className.replace(/hidden/g,"")
        } else {
            fileUpload = false
            fileUploadWrap.className = fileUploadWrap.className + " hidden"
            recordBtnWrap.className = recordBtnWrap.className.replace(/hidden/g,"")
        }
    })


    /**
     * Record user audio
     */

    const mediaDevices = navigator.mediaDevices
    if(!mediaDevices) {
        fileUpload = true
        recordBtnWrap.className = recordBtnWrap.className + " hidden"
        fileUploadWrap.className = fileUploadWrap.className.replace(/hidden/g,"")
        const wrap =  document.querySelector(".recordWrap")
        wrap.className = wrap.className + " file-upload-only"
    }

    const recordBtn = document.querySelector("#recordBtn")
    const recordBtnClass = recordBtn.className
    let recInt, timer, track, recordingState = false, touchMode = false

    const startRecording = () => {
        recordBtn.className += " progress-0"
        mediaDevices.getUserMedia({audio: true})
            .then((stream) => {
                recorder.init(stream)
                recorder.start()
                    .then(() => {
                        recordingState = true
                        timer = 0
                        track = stream.getTracks()[0]
                        recInt = setInterval(() => {
                            const previousTime = timer
                            timer += 100
                            if(timer >= 2000 && recordingState)
                                endRecording()
                            recordBtn.className = recordBtn.className.replace("progress-" + (previousTime / 20), "progress-" + (timer / 20))
                        }, 100)
                    })
            })
            .catch((err) => {
                console.log('Recording failed: ', err)
                recordBtn.className = recordBtnClass
                recordingState = false
            })
    }

    const endRecording = () => {
        recordBtn.className = recordBtnClass
        recordingState = false
        clearInterval(recInt)
        recorder.stop()
            .then(({blob}) => {
                recordingFile = blob
            })
        track.stop()
    }

    recordBtn.addEventListener("mousedown", (e) => {
        e.preventDefault()
        if(!touchMode)
            startRecording()
    })
    recordBtn.addEventListener("mouseup", (e) => {
        e.preventDefault()
        if(recordingState && !touchMode)
            endRecording()
    })
// For mobile touch + hold event, with lock to prevent detecting click
    recordBtn.addEventListener("touchstart", (e) => {
        e.preventDefault()
        touchMode = true
        startRecording()
    })
    recordBtn.addEventListener("touchend", (e) => {
        e.preventDefault()
        if(recordingState)
            endRecording()
        setTimeout(() => touchMode = false, 3000)
    })


    /**
     * File Upload manager
     */

    const chooseFileBtn = document.querySelector("#chooseFileBtn")
    const fileUploadInput = document.querySelector("#fileUploadInput")
    const fileIcon = document.querySelector("#fileIcon")
    const fileName = document.querySelector("#fileName")


    const processFileUpload = (file) => {
        if(file.size > 200000 || (file.type !== "audio/wav" && file.type !== "audio/x-wav")) {
            displayMessage("Submit WAV files under 200kB only.")
            return
        }
        recordingFile = file
        fileIcon.className = fileIcon.className + " hidden"
        fileName.innerHTML = file.name
        fileName.className = fileName.className.replace(/hidden/g, "")
        inputFile = true
    }

    const removeFileUpload = () => {
        recordingFile = null
        fileName.className = fileName.className + " hidden"
        fileName.innerHTML = ""
        fileIcon.className = fileIcon.className.replace(/hidden/g, "")
        inputFile = false
    }


    chooseFileBtn.addEventListener("dragover", (e) => {
        e.preventDefault()
        e.stopPropagation()
    })
    chooseFileBtn.addEventListener("dragenter", (e) => {
        e.preventDefault()
        e.stopPropagation()
        chooseFileBtn.className = chooseFileBtn.className + " dropping"
    })
    chooseFileBtn.addEventListener("dragleave", (e) => {
        e.preventDefault()
        e.stopPropagation()
        chooseFileBtn.className = chooseFileBtn.className.replace(/dropping/g, "")
    })
    chooseFileBtn.addEventListener("drop", (e) => {
        e.preventDefault()
        e.stopPropagation()
        chooseFileBtn.className = chooseFileBtn.className.replace(/dropping/g, "")
        processFileUpload(e.dataTransfer.files[0])
    })

    fileUploadInput.addEventListener("change", () => {
        processFileUpload(fileUploadInput.files[0])
    })


    /**
     * Submit user audio
     */

    const submitBtn = document.querySelector("#submitBtn")

    const uploadRecording = () => {
        if(!recordingFile) {
            displayMessage("Provide audio to upload.")
            return
        }
        const data = new FormData()
        const blob = new Blob([recordingFile], {type: 'audio/wav'})
        data.append('fileupload', blob)
        const options = {
            method: 'POST',
            body: data
        }
        fetch('/api/upload', options)
            .then(checkStatus)
            .then((resp) => {
                return resp.json()
            })
            .then((res) => {
                let message = res.success || res.error || "Unknown error."
                displayMessage(message)

                // Remove file to prevent accidental re-upload
                if(inputFile)
                    removeFileUpload()
                else
                    recordingFile = null
            })
            .catch(function() {
                displayMessage("Upload failed.")
                if(inputFile)
                    removeFileUpload()
                else
                    recordingFile = null
            })
    }

    submitBtn.addEventListener("click", (e) => {
        e.preventDefault()
        uploadRecording()
    })
})()
