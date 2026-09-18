'use strict'
/**
 * For now, I am removing the need for length checking
 * Because we ostensibly restrict that with size checking
 * And should more enforce size than length
 * We could possibly expect people later to mess with it
 * but who really cares for MVP, we just don't want to
 * mess with huge files for now.
 *
 * The same goes for user login, I mean who needs to login?
 *
 * Also position won't be a user thing, at least for now,
 * we will just get a "random.org" set of values.
 *
 * So, because there is no data beyond the file, we can
 * avoid using a deque and instead iterate through all
 * the files currently being processed.
 */
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const fs = require('fs')
const http = require('http')
const request = require('request')
const utils = require('./components/utils')
const multer = require('multer') // v1.0.5
const LoopingAudioFile = require('./components/LoopingAudioFile')

const TEMP = __dirname + '/uploads/temp/'
const UPLD = __dirname + '/uploads/que/'
const MAST = __dirname + '/master/'
const upload = multer({
    dest:TEMP,
    limits: {
        fileSize: 200000,
        files: 1,
        parts: 1
    }
}).single('fileupload') // for parsing multipart/form-data
const masterLength = 10
let masterFile = 'master'
let master1 = new LoopingAudioFile(123, masterFile, null, [0, 0, 0], masterLength)


app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded



/**
 * As the browser doesn't often offer a standalone audio player
 * We have a location for a file, and one for an html audio player
 * The audio player should be supported by a web audio api player
 * As the html5 player has a gap in the audio loop, and we want it
 * to loop endlessly and seamlessly.
 *
 * Additionally, creating a streaming buffer of the audio, at this stage,
 * is pointless an convoluted for the MVP. However this truth may
 * eventually change. This change is likely to occur when these
 * conditions are potentially met:
 * 1. There is a need for RT consistency amongst all listeners
 * 2. Files become super large and constantly change
 *
 * For now, what we want to do is intermittently check for an update
 * to the audio file (denoted by a change in update date requested
 * via an endpoint). The file is looped into the buffer every 30sec
 * in order to provide enough time and data to fetch files and place
 * the updated audio into the buffer. This may also be implemented with
 * some form of loop, where the listener can choose when to fetch and
 * load the new audio as they may want to not do more downloads or change
 * what they are listening to immediately.
 *
 * We can create a looping stream easily but we need to do a few things:
 * 1. Ensure we only have 1 buffer being read by all clients
 * 2. The buffer is not being stored
 * 3. The playback is seamless
 */
// For future ref
// let audio;
// function start() {
//     audio = fs.createReadStream('./master/master.wav')
//     audio.on('ended', () => {
//         start()
//     })
// }
// start()
// TODO: relevant to individual master files
app.get('/master.wav', (req, res) => {
    // For future ref
    // audio.pipe(res)

    // res.sendFile(__dirname + '/' + MAST + masterFile + '.wav')
})
app.get('/audio', (req, res) => {
    const webpage = `
        <!DOCTYPE html>
        <html>
            <head>
                <title>test audio</title>
            </head>
            <body>
                <audio src="/master.wav" type="audio/wav" controls autoplay loop>
                    You don't get audio
                </audio>
            </body>
        </html>
    `
    res.send(webpage)
})
// TODO: Relevant to individual master files
app.get('/update', (req, res) => {
    // res.json({"lastUpdated": lastUpdated, "submissions": submissions})
})


// curl -F "fileupload=@Desktop/test1.wav" localhost:3000/upload
app.post('/upload', (req, res) => {
    upload(req, res, function (err) {
        if (err) {
            // An error occurred when uploading
            console.log(err)
            if(err.code === 'LIMIT_FILE_SIZE')
                res.send({error: 'File size too large.'})
            else
                res.send({error: 'There was an error: code 3.'})
            return
        }

        // Everything went fine
        // console.log(req.file)
        // Multer should've parsed the file
        // Change sample rate to 44.1k, bit rate to 16, normalise to 0, mix to mono, save with hash
        utils.createNiceUpload(req.file.path, UPLD, (err, hash) => {
            if(err) {
                fs.unlink(req.file.path)
                return res.status(err.stat).send({error: err.msg})
            }

            res.send({success: "Good stuff"})
            master1.addNewUploads(hash)
            master1.startProcessAudio(UPLD, MAST, 2)
                .then(console.log)
                .catch(console.error)
                .then(() => {
                    fs.unlink(req.file.path)
                })
        })
    })
})

app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
})