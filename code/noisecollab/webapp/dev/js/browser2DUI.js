/**
 * 2D UI setup
 */

export default function build2DUI() {
    const contentWrap = document.getElementById('contentWrap')
    const jsWrap = document.createElement('DIV')
    jsWrap.className = 'contentWrapInner'
    jsWrap.innerHTML = `
    <header class="contentHeader">
        <h1 class="glitch" data-text="noisecollab">
            <a href="/">
                noisecollab
            </a>
        </h1>
    </header>
    <div class="masterWrap">
        <div id="toggleMaster" class="audioBtnWrap" title="Toggle Master Audio">
            <span id="masterBtnIcon" class="audioToggleBtn masterBtnIcon playBtn"></span>
        </div>
        <div id="reloadMaster" class="audioBtnWrap reloadBtn manual" title="Reload Master for Update" disabled>
            <span id="reloadBtnIcon" class="reloadBtnIcon"></span>
            <span id="autoReloadBtnIcon" class="autoReloadBtnIcon"></span>
        </div>
        <div class="switchWrap">
            <div class="switchWrapInner">
                <input id="autoReloadCheck" type="checkbox">
                <label for="autoReloadCheck" class="switchLabel" title="Automatic Reload"></label>
            </div>
        </div>
        <span id="submissions" class="submissions" title="Submission Count">0</span>
    </div>
    <div class="recordWrap">
        <div class="recordWrapTop">
            <div class="recordBtnWrap">
                <div id="recordBtn" class="audioBtnWrap recordBtn pie-wrapper pie-wrapper--solid" title="Start Recording">
                    <span id="recordIcon" class="microphone"></span>
                </div>
                <div id="toggleRecording" class="audioBtnWrap" title="Toggle User Audio">
                    <span id="recordingBtnIcon" class="audioToggleBtn recordingBtnIcon playBtn"></span>
                </div>
            </div>
            <div class="fileUploadWrap hidden">
                <input id="fileUploadInput" class="chooseFileInput" type="file" accept="audio/wav,.wav"/>
                <label for="fileUploadInput" id="chooseFileBtn" class="chooseFileBtn" title="Drop File Here or Press to Choose">
                    <span id="fileIcon" class="document-item" data-filetype="wav"></span>
                    <span id="fileName" class="file-name hidden"></span>
                </label>
            </div>
            <div class="switchWrap">
                <div class="switchWrapInner">
                    <input id="fileUploadCheck" type="checkbox">
                    <label for="fileUploadCheck" class="switchLabel" title="Switch Upload Type"></label>
                </div>
            </div>
        </div>
        <div id="submitBtn" class="submitBtn" title="Submit Audio">
            <span class="upload-icon"></span>
        </div>
    </div>
    <div id="messagesWrap" class="messagesWrap closed">
        <p id="messages" class="messages"></p>
        <div id="messagesClose" class="messagesClose">&times;</div>
    </div>
    `
    contentWrap.appendChild(jsWrap)
}