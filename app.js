/*
Comando ffmepg que roda camera 1: ffmpeg -rtsp_transport tcp -i "rtsp://admin:admin123@projetoxb.ddns-intelbras.com.br:554/cam/realmonitor?channel=1&subtype=0" -c copy teste.mkv
Comando ffmepg que roda camera 2: ffmpeg -rtsp_transport tcp -i "rtsp://aguiahb:aguiahb99@aguiahb1.ddns-intelbras.com.br:8082/cam/realmonitor?channel=1&subtype=0" -c copy teste.mkv
*/


const express = require('express');
const http = require('http');
const bodyParser = require('body-parser'); // Adicionado para processar o corpo da solicitação POST
const Stream = require('node-rtsp-stream');
const cors = require('cors')

const app = express();
const server = http.createServer(app);

app.use(bodyParser.json()); // Adiciona middleware para processar o corpo JSON
app.use(cors())
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }))

let stream = new Stream({
  name: 'Stream1',  // Change the name as desired
  //streamUrl: 'rtsp://admin:admin123@projetoxb.ddns-intelbras.com.br:554/cam/realmonitor?channel=1&subtype=0',
  streamUrl: 'rtsp://aguiahb:aguiahb99@aguiahb1.ddns-intelbras.com.br:8082/cam/realmonitor?channel=1&subtype=0',
  wsPort: 6789, // Maintain the same websocket port
  ffmpegOptions: {
    '-rtsp_transport': 'tcp', // Adicione esta linha
    '-codec:v': 'mpeg1video',
    '-r': 30,
    '-f': 'mpegts',
    '-b:v': '2000k',
  },
});

// let stream = new Stream({
//   name: 'Bunny',
//   //streamUrl: 'rtsp://aguiahb:aguiahb99@aguiahb1.ddns-intelbras.com.br:8082/cam/realmonitor?channel=1&subtype=0',
//   streamUrl: 'rtsp://admin:admin123@projetoxb.ddns-intelbras.com.br:554/cam/realmonitor?channel=1&subtype=0',
//   wsPort: 6789,
//   ffmpegOptions: {
//     '-f': 'mpegts',
//     '-codec:v': 'mpeg1video',
//     '-b:v': '2000k',
//     '-stats': '',
//     '-r': 25,
//     '-bf': 0,
//     '-codec:a': 'mp2',
//     '-ar': 44100,
//     '-ac': 1,
//     '-b:a': '128k',
//   },
// });

// Rota para acessar o stream
// app.get('/stream', (req, res) => {
//   // Você pode personalizar a resposta aqui, por exemplo, definindo cabeçalhos, etc.
//   // res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=--myboundary');

//   // Conecta o WebSocket quando um cliente solicita a rota
//   stream.start();

//   // Você pode enviar a resposta do stream diretamente para o cliente se desejar
//   stream.wsServer.handleUpgrade(req, req.socket, Buffer.alloc(0), (socket) => {
//     stream.wsServer.emit('connection', socket, req);
//   });
// });

// Rota POST para alterar a streamUrl e reiniciar o stream
app.post('/changestream', (req, res) => {
  const newStreamUrl = req.body.streamUrl;

  // Verifica se a nova streamUrl é fornecida
  if (!newStreamUrl) {
    return res.status(400).json({ error: 'A nova streamUrl não foi fornecida.' });
  }

  // Para o stream atual
  stream.stop();

  stream = new Stream({
    name: 'Bunny',
    streamUrl: newStreamUrl,
    wsPort: 6789,
    ffmpegOptions: {
      '-f': 'mpegts',
      '-codec:v': 'mpeg1video',
      '-b:v': '2000k',
      '-stats': '',
      '-r': 25,
      '-bf': 0,
      '-codec:a': 'mp2',
      '-ar': 44100,
      '-ac': 1,
      '-b:a': '128k',
    },
  });

  res.json({ message: 'StreamUrl alterada com sucesso.' });
});

const PORT = process.env.PORT || 3030;

server.listen(PORT, () => {
  console.log(`Servidor Express ouvindo na porta ${PORT}`);
});
