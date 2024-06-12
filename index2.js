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

app.post('/changeUrl', (req, res) => {
    streamUrl = req.body.stream;

    // Close all WebSocket connections and the WebSocket server
    if (wss) {
        wss.clients.forEach(client => {
            client.terminate();
        });
        wss.close(() => {
            console.log('WebSocket server closed');

            // Kill the ffmpeg process
            if (ffmpeg) {
                ffmpeg.kill('SIGINT');
                ffmpeg.on('close', () => {
                    console.log('ffmpeg process killed');
                    // Restart the WebSocket server
                    startWebSocketServer();
                    res.status(200).json({ message: 'Stream changed' });
                });
            } else {
                // Restart the WebSocket server if ffmpeg is not running
                startWebSocketServer();
                res.status(200).json({ message: 'Stream changed' });
            }
        });
    } else {
        res.status(500).json({ message: 'WebSocket server not running' });
    }
});

app.listen(3030, () => {
    console.log('Server is running on port 3030');
});
