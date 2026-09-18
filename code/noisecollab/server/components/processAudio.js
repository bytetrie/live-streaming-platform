/**
 * Processing Audio takes a master file, and gets a random amount of files from it's bank of uploads to insert
 * It then gets a list of numbers of length equal to number of files to be inserted
 * The randomly selected files are then "mixed" into the master file
 *
 * Randomness may be replaced by user selected positions sometime...
 *
 * Notes on processing:
 * - Master file is always consistent
 * - Upload file length is always consistent
 * - File formats are always consistent
 */

const utils = require('./utils')
const request = require('request')
const fs = require('fs')
let processing = false

function processAudio(master, uploadDir, masterDir, fileLength) {
    return new Promise(
        (resolve, reject) => {
            if (processing) // Already processing
                return resolve("Already processing")
            processing = true // Lock processing

            // Get series of 0s and 1s equal to length of uploads,
            // each 1 equals a file to use from bank of uploads when iter.
            // Get list of positions equal to the list of uploads that will be used
            // Insert audio into master at given positions (if position === master length, position = 0)
            const uploads = master.getUploadsList()
            const sec = master.getLengthInSeconds()
            const hash = master.getFileHash()
            return getInsertableUploads(uploads)
                .then(insertable => {
                    if(insertable.length === 0)
                        return resolve("Completed, nothing inserted")
                    return getInsertablesWithPositions(insertable, sec)
                })
                .then(insertablesWithPositions => {
                    if(!insertablesWithPositions)
                        return
                    return buildAudioFromList(insertablesWithPositions, fileLength, sec, uploadDir, masterDir, hash, [])

                })
                .then(insertInfoList => {
                    if(!insertInfoList)
                        return
                    for(let insert of insertInfoList) {
                        master.addNewInserts(insert.fileHash, insert.position)
                    }
                    const newHash = insertInfoList[insertInfoList.length - 1].newMasterHash
                    master.setFileHash(newHash)
                    master.resetLastUpdated()
                    resolve("Completed list")
                })
                .then(() => {
                    processing = false
                })
                .catch((error) => {
                    processing = false
                    reject(error)
                })
        }
    )
}
function getInsertableUploads(uploads) {
    return new Promise(
        (resolve, reject) => {
            let url = "https://www.random.org/integers/?num="
            url += uploads.length
            url += "&min=0&max=1&col=1&base=10&format=plain&rnd=new"

            // TODO: if request doesn't work, use another method for getting random values
            request(url, (error, response, body) => {
                // TODO: If err, just use js pseudo-random
                if(error)
                    return reject("Error generating numbers")
                // TODO: validate the array of numbers
                const arr = body.split('\n')
                arr.pop()
                let insertList = []
                for(let i = 0; i < uploads.length; i++) {
                    if(arr[i] === "1")
                        insertList.push(uploads[i])
                }
                resolve(insertList)
            })
        }
    )
}
function getInsertablesWithPositions(insertable, maxPosition) {
    return new Promise(
        (resolve, reject) => {
            let max = maxPosition * 1000 - 1
            let url = "https://www.random.org/integers/?num="
            url += insertable.length
            url += "&min=0&max="
            url += max // position !== maxPosition
            url += "&col=1&base=10&format=plain&rnd=new"

            // TODO: if request doesn't work, use another method for getting random values
            request(url, (error, response, body) => {
                // TODO: If err, just use js pseudo-random
                if(error)
                    return reject("Error generating numbers")
                // TODO: validate the array of numbers
                const arr = body.split('\n')
                arr.pop()
                let combined = []
                combined.push(insertable)
                combined.push(arr)
                resolve(combined)
            })
        }
    )
}
function buildAudioFromList(list, fileLength, maxPosition, uploadDir, masterDir, masterHash, insertInfoList) {
    return new Promise(
        (resolve, reject) => {
            if(!list || list[0].length === 0)
                return resolve(insertInfoList)
            const fileHash = list[0].pop()
            const position = list[1].pop() * 0.001 // Convert from millis to secs (float)
            return buildAudio(fileLength, position, maxPosition, uploadDir, fileHash, masterDir, masterHash)
                .then(insertInfo => {
                    insertInfoList.push(insertInfo)
                    return buildAudioFromList(list, fileLength, maxPosition, uploadDir, masterDir, insertInfo.newMasterHash, insertInfoList)
                })
                .then(resolve)
                .catch(reject)
        }
    )
}
function buildAudio(fileLength, position, maxPosition, fileDir, fileHash, masterDir, masterFile) {
    return new Promise(
        (resolve, reject) => {
            // insert audio, if pos+fL >= mP then trim and insert end at beginning
            if(position + fileLength < maxPosition) {
                return insertAudio(masterFile, masterDir, fileLength, fileDir, fileHash, maxPosition, position)
                    .then(newMasterHash => {
                        resolve({fileHash: fileHash, position: position, newMasterHash: newMasterHash})
                    })
                    .catch(reject)
            } else {
                const cut = position + fileLength - maxPosition
                const file = fileDir + fileHash + '.wav'
                return utils.trimAudio(file, fileDir, 0, cut)
                    .then(trimHash1 => {
                        return insertAudio(masterFile, masterDir, cut, fileDir, trimHash1, maxPosition, position, false)
                            .then(tempMasterHash => {
                                fs.unlink(fileDir + trimHash1 + '.wav')
                                return utils.trimAudio(file, fileDir, cut, '')
                                    .then(trimHash2 => {
                                        return insertAudio(masterFile, masterDir, fileLength - cut, fileDir, trimHash2, maxPosition, 0, [tempMasterHash])
                                            .then(newMasterHash => {
                                                fs.unlink(fileDir + trimHash2 + '.wav')
                                                resolve({fileHash: fileHash, position: position, newMasterHash: newMasterHash})
                                            })
                                    })
                                    .catch(reject)
                            })
                    })
                    .catch(reject)
            }

        }
    )
}
function insertAudio(masterFile, masterDir, fileLength, fileDir, fileHash, maxPosition, position, oldMaster) {
    let file = fileDir + fileHash + '.wav' // All files are wav
    let master = masterDir + masterFile + '.wav' // Master is wav
    let preFile, mixableFile, newMixFile, postFile // So we can clean these up later
    return new Promise(
        (resolve, reject) => {
            return utils.trimAudio(master, masterDir, 0, position)
                .then(preMix => {
                    return utils.trimAudio(master, masterDir, position, fileLength)
                        .then(mixable => {
                            const addPost = (position + fileLength < maxPosition) // Post mix might be irrelevant...
                            const postStart = addPost ? position + fileLength : maxPosition - 1
                            return utils.trimAudio(master, masterDir, postStart, '')
                                .then(postMix => {
                                    mixableFile = masterDir + mixable + '.wav'
                                    return utils.mixFiles([mixableFile, file], masterDir)
                                        .then(newMix => {
                                            preFile = masterDir + preMix + '.wav'
                                            newMixFile = masterDir + newMix + '.wav'
                                            postFile = masterDir + postMix + '.wav'
                                            const concatPost = addPost ? postFile : ''
                                            return utils.createMaster([preFile, newMixFile, concatPost], masterDir, maxPosition)
                                        })
                                        .then(newMasterHash => {
                                            fs.unlink(mixableFile)
                                            fs.unlink(preFile)
                                            fs.unlink(newMixFile)
                                            fs.unlink(postFile)
                                            if(masterFile !== 'master' && oldMaster !== false)
                                                fs.unlink(masterDir + masterFile + '.wav') // Remove old master
                                            if(oldMaster && oldMaster.length > 0) {
                                                for(let element of oldMaster) {
                                                    fs.unlink(masterDir + element + '.wav')
                                                }
                                            }
                                            resolve(newMasterHash)
                                        })
                                })
                        })
                })
                .catch(reject)
        }
    )
}

module.exports = processAudio