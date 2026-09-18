const checkValidFormat = (file, done) => {
    const exec = require('child_process').exec
    const process = exec('soxi -t "' + file + '"')
    process.stdout.on('data', (data) => {
        if(!/wav/.test(data))
            return done({msg: "Invalid file format.", stat: 415})

        done(null, true)
    })
    process.stderr.on('data', () => {
        done({msg: "There was an error: code 1.", stat: 415})
    })
}

// const checkValidLength = (file, done) => {
//     const exec = require('child_process').exec
//     const process = exec('soxi -D "' + file + '"')
//     process.stdout.on('data', (data) => {
//         if(data > 2)
//             return done("Upload play length too long")
//
//         done(null, true)
//     })
// }

const getLength = (file, done) => {
    const exec = require('child_process').exec
    const process = exec('soxi -D "' + file + '"')
    process.stdout.on('data', (data) => {
        done(null, parseFloat(data.trim()))
    })
    process.stderr.on('data', (data) => {
        console.log(data)
        done(true)
    })
}

// Input file, output file path
// Start trim time in seconds (float)
// Duration of trim in seconds or null for end
// Return file hash
const trimAudio = (inputFile, outputDir, start, duration, done) => {
    const exec = require('child_process').exec
    const process = exec('openssl rand -hex 3')
    process.stdout.on('data', (data) => {
        const hash = data.trim()
        // console.log("Saving as: " + hash)
        const cmd = 'sox ' + inputFile + ' ' + outputDir + hash + '.wav trim ' + start + ' ' + duration
        // console.log("Trim cmd: " + cmd)
        exec(cmd, (error) => {
            if(error) {
                console.log(error)
                return done(true)
            }
            done(null, hash)
        })
    })
}

// Input array of files to mix together
// Output filepath of mix
// Return file hash
const mixFiles = (inputFiles, outputDir, done) => {
    const exec = require('child_process').exec
    const process = exec('openssl rand -hex 3')
    process.stdout.on('data', (data) => {
        const hash = data.trim()
        // console.log("Saving as: " + hash)
        const cmd = 'sox ' + inputFiles.join(' ') + ' ' + outputDir + hash + '.wav --combine mix'
        exec(cmd, (error) => {
            if(error) {
                console.log(error)
                return done(true)
            }
            done(null, hash)
        })
    })
}

// Input array of files to concat together
// Output filepath of mix
const concatFiles = (inputFiles, outputDir, done) => {
    const exec = require('child_process').exec
    const process = exec('openssl rand -hex 3')
    process.stdout.on('data', (data) => {
        const hash = data.trim()
        // console.log("Saving as: " + hash)
        const cmd = 'sox ' + inputFiles.join(' ') + ' ' + outputDir + hash + '.wav --combine concatenate'
        // console.log(cmd)
        exec(cmd, (error) => {
            if(error) {
                console.log(error)
                return done(true)
            }
            done(null, hash)
        })
    })
}

const createMaster = (inputFiles, outputDir, maxLength, done) => {
    concatFiles(inputFiles, outputDir, (err, hash1) => {
        getLength(outputDir + hash1 + '.wav', (err, length) => {
            const exec = require('child_process').exec
            const process = exec('openssl rand -hex 3')
            process.stdout.on('data', (data) => {
                const hash2 = data.trim()
                // console.log("Saving as: " + hash2)
                if (!length || length <= 0)
                    length = maxLength
                const cmd = 'sox ' + outputDir + hash1 + '.wav ' + outputDir + hash2 + '.wav tempo -q ' +
                    length / maxLength + ' compand 0.0001,0.0002 0.1:-80,-75,-1 norm 0'
                // console.log(cmd)
                exec(cmd, (error) => {
                    if(error) {
                        console.log(error)
                        return done(true)
                    }
                    done(null, hash2)
                })
            })
        })
    })
}

const createNiceUpload = (file, dest, done) => {
    checkValidFormat(file, (err) => {
        if(err)
            return done(err)

        const exec = require('child_process').exec
        const process = exec('openssl rand -hex 3')
        process.stdout.on('data', (data) => {
            const hash = data.trim()
            // console.log("Saving as: " + hash)
            const cmd = 'sox ' + file + ' -b 16 ' + dest + hash +
                '.wav channels 1 rate 44.1k compand 0.0001,0.0002 0.1:-80,-75,-1 norm 0 trim 0 2'
            exec(cmd, (error) => {
                if(error)
                    return done({msg: "There was an error: code 2.", stat: 400})
                done(null, hash)
            })
        })
    })
}

exports = module.exports = {
    // checkValidFormat: checkValidFormat,
    // checkValidLength: checkValidLength,
    getLength: getLength,
    createNiceUpload: createNiceUpload,
    trimAudio: trimAudio,
    mixFiles: mixFiles,
    concatFiles: concatFiles,
    createMaster: createMaster
}