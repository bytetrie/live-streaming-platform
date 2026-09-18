const express = require("express")
const app = express()
const bodyParser = require('body-parser')
const path = require("path")
const http = require("http")
const multer  = require('multer')
const request = require('request')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
const querystring = require('querystring')
const pubDir = path.join(__dirname, "public")
const port = 1337

app.use(bodyParser.urlencoded({ extended: true }))


app.get('/', (req, res) => {
    res.sendFile(path.join(pubDir, "index.html"))
})

app.get('/main.css', (req, res) => {
    res.sendFile(path.join(pubDir, "main.css"))
})

app.get('/main.css.map', (req, res) => {
    res.sendFile(path.join(pubDir, "main.css.map"))
})

app.get('/main.js', (req, res) => {
    res.sendFile(path.join(pubDir, "main.js"))
})

app.get('/main.js.map', (req, res) => {
    res.sendFile(path.join(pubDir, "main.js.map"))
})

app.get('/api/:q', (req, res) => {
    const options = {
        host: 'localhost',
        port: 3000,
        path: '/' + req.params.q,
        method: 'GET',
        headers: req.headers
    }
    const creq = http.request(options, function(cres) {
        cres.on('data', function(chunk){
            res.write(chunk)
        })
        cres.on('end', function(){
            res.end()
        })
    }).on('error', function(e) {
        console.error(e.message)
        res.status(500).send("Invalid API endpoint")
        res.end()
    })
    creq.end()
})

app.post('/api/upload', upload.single('fileupload'), (req, res) => {
    const formData = {
        'fileupload': {
            value: req.file.buffer,
            options: {
                filename: 'audio.wav',
                contentType: 'audio/x-wave'
            }
        }
    }
    request.post({url: 'http://localhost:3000/upload', formData: formData}, (err, httpResponse, body) => {
        if (err) {
            console.error(err)
            res.status(500).send("Invalid API enpoint")
            if(req.body.formUpload === "true")
                return res.redirect('/')
            return res.end()
        }
        // console.log('Upload successful!  Server responded with:', body)
        if(req.body.formUpload === "true")
            return res.redirect('/')
        res.write(body)
        res.end()
    })
})

app.listen(port, function () {
    console.log('Test app listening on port ' + port)
})