const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const wss = new WebSocket.Server({ port: 6789 });

wss.on('connection', ws => {
    const ffmpeg = spawn('ffmpeg', [
        '-rtsp_transport',
        'tcp',
        '-i',
        'rtsp://aguiahb:aguiahb99@aguiahb1.ddns-intelbras.com.br:8082/cam/realmonitor?channel=1&subtype=0',
        '-f',
        'mpegts',
        '-codec:v',
        'mpeg1video',
        '-'
    ]);

    ffmpeg.stdout.on('data', data => {
        ws.send(data);
    });

    ffmpeg.stderr.on('data', data => {
        console.error(`stderr: ${data}`);
    });

    ffmpeg.on('close', code => {
        console.log(`child process exited with code ${code}`);
    });

    ws.on('close', () => {
        ffmpeg.kill('SIGINT');
    });
});

app.listen(3030, () => {
    console.log('Server is running on port 3030');
});