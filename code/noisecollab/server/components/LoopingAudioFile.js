/**
 * Master Audio Files
 * - ID (hash)
 * - Created (date)
 * - Last Updated (date)
 * - Location Coordinates (List[x, y, z])
 * - Number of reloads (int)
 * - Seeded by (id of seed file)
 * - Seeds (List[ids of seeds])
 * - Uploads (List[ids of assoc. uploads])
 * - Inserts (List[[ids of uploads, positions of inserts]])
 *
 *
 * Master Files (stored as WAV, with MP3 file)
 * - Length = 6 seconds
 */
const processAudio = require('./processAudio')

class LoopingAudioFile {
    constructor(id, fileHash, seed, location, length) {
        this.id = id
        this.fileHash = fileHash
        this.created = new Date()
        this.lastUpdated = new Date()
        this.location = location // [x, y, z]
        this.reloads = 0
        this.seed = seed
        this.seeded = []
        this.uploads = []
        this.inserts = [] // Element = [upload id, position]
        this.length = length // seconds
    }

    getID() {
        return this.id
    }

    getFileHash() {
        return this.fileHash
    }

    setFileHash(hash) {
        this.fileHash = hash
    }

    getCreated() {
        return this.created
    }

    getLastUpdated() {
        return this.lastUpdated
    }

    resetLastUpdated() {
        this.lastUpdated = new Date()
    }

    getLocation() {
        return this.location
    }

    getReloads() {
        return this.reloads
    }

    bumpReloads() {
        this.reloads += 1
    }

    getSeed() {
        return this.seed
    }

    getSeededList() {
        return this.seeded
    }

    getSeededByIndex(index) {
        return this.seeded[index]
    }

    addNewSeeded(id) {
        this.seeded.push(id)
    }

    getUploadsList() {
        return this.uploads
    }

    getUploadsByIndex(index) {
        return this.uploads[index]
    }

    addNewUploads(id) {
        this.uploads.push(id)
    }

    getInsertsById(id) {
        return this.inserts.filter((el) => {
            return el[0] === id
        })
    }

    getInsertsByPositionRange(min, max) {
        return this.inserts.filter((el) => {
            return el[1] >= min && el[1] < max
        })
    }

    addNewInserts(id, position) {
        this.inserts.push([id, position])
    }

    getLengthInSeconds() {
        return this.length
    }

    startProcessAudio(uploadDir, masterDir, fileLength) {
        return new Promise((resolve, reject) => {
            processAudio(this, uploadDir, masterDir, fileLength)
                .then(resolve)
                .catch(reject)
        })
    }
}

module.exports = LoopingAudioFile