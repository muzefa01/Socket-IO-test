const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
var players = []


const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('.'));

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('updatePlayers', (data) => {
    for (player of players ){
        if (player.id === socket.id){
        }
    }
    io.emit('updatePlayers', players);
  });

  socket.on('disconnect', () => {
    let count = 0;
  
    for (let player of players) {
      if (player.id === socket.id) {
        players.splice(count, 1); 
        break; 
      }
      count += 1; 
    }
  
    console.log(`Player disconnected: ${socket.id}`);
  });
  
});
