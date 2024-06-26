const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');

const app = express();
app.use(cors());
app.use(bodyParser.json());

let ffmpeg;
let wss;
let currentWs;
let streamUrl = 'rtsp://aguiahb:aguiahb99@aguiahb1.ddns-intelbras.com.br:8082/cam/realmonitor?channel=1&subtype=0';

const startFFmpeg = (ws) => {
    ffmpeg = spawn('ffmpeg', [
        '-rtsp_transport', 'tcp',
        '-i', streamUrl,
        '-f', 'mpegts',
        '-codec:v', 'mpeg1video',
        '-loglevel', 'error',
        '-'
    ]);

    ffmpeg.stdout.on('data', data => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
    });

    ffmpeg.stderr.on('data', data => {
        console.error(`stderr: ${data}`);
    });

    ffmpeg.on('close', code => {
        console.log(`child process exited with code ${code}`);
        // Restart ffmpeg if it crashes
        if (ws.readyState === WebSocket.OPEN) {
            startFFmpeg(ws);
        }
    });

    ws.on('close', () => {
        if (ffmpeg) {
            ffmpeg.kill('SIGINT');
        }
    });
};

const startWebSocketServer = () => {
    wss = new WebSocket.Server({ port: 6789 });

    wss.on('connection', ws => {
        currentWs = ws;
        startFFmpeg(ws);
    });

    wss.on('close', () => {
        console.log('WebSocket server closed');
    });
};

startWebSocketServer();

const stopFFmpeg = (callback) => {
    if (ffmpeg) {
        ffmpeg.on('close', () => {
            console.log('ffmpeg process killed');
            ffmpeg = null;
            if (callback) callback();
        });
        ffmpeg.kill('SIGINT');
    } else if (callback) {
        callback();
    }
};

app.post('/changeUrl', (req, res) => {
    streamUrl = req.body.stream;
    if (!streamUrl) {
        return res.status(400).json({ message: 'Stream URL is required' });
    }

    stopFFmpeg(() => {
        if (currentWs && currentWs.readyState === WebSocket.OPEN) {
            startFFmpeg(currentWs);
        }
        res.status(200).json({ message: 'Stream changed' });
    });
});

app.listen(3030, () => {
    console.log('Server is running on port 3030');
});
