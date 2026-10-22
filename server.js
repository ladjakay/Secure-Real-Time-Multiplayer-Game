require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const socket = require('socket.io');
const path = require('path');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();
app.disable('x-powered-by');
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.noCache());
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'PHP 7.4.3');
  next();
});

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

fccTestingRoutes(app);

app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

const portNum = process.env.PORT || 3000;
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(() => {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

const io = socket(server);
const players = new Map();
const collectibleCount = 8;
const world = { width: 960, height: 600 };
const movementStep = 7;
const movementInterval = 35;
const playerColors = ['#43e6c3', '#b894ff', '#64b5ff', '#ff7d9c', '#f5dc68'];
let colorIndex = 0;

const playerModule = import('./public/Player.mjs');
const collectibleModule = import('./public/Collectible.mjs');
const gameObjects = Promise.all([playerModule, collectibleModule]);
let collectibles = [];

function createCollectible(Collectible) {
  return new Collectible({
    id: `gem-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    x: Math.round(24 + Math.random() * (world.width - 48)),
    y: Math.round(24 + Math.random() * (world.height - 48)),
    value: 1
  });
}

function publicState() {
  return {
    players: [...players.values()].map(player => ({
      id: player.id,
      x: player.x,
      y: player.y,
      score: player.score,
      color: player.color,
      radius: player.radius
    })),
    collectibles: collectibles.map(item => ({
      id: item.id,
      x: item.x,
      y: item.y,
      value: item.value,
      radius: item.radius
    }))
  };
}

function broadcastState() {
  io.emit('game:state', publicState());
}

gameObjects.then(([, collectibleExports]) => {
  const Collectible = collectibleExports.default;
  collectibles = Array.from({ length: collectibleCount }, () => createCollectible(Collectible));

  io.on('connection', client => {
    gameObjects.then(([playerExports]) => {
      const Player = playerExports.default;
      const radius = 15;
      const player = new Player({
        id: client.id,
        x: Math.round(radius + Math.random() * (world.width - radius * 2)),
        y: Math.round(radius + Math.random() * (world.height - radius * 2)),
        score: 0,
        color: playerColors[colorIndex++ % playerColors.length]
      });
      players.set(client.id, player);
      let lastMoveAt = 0;
      broadcastState();

      client.on('game:move', direction => {
        const now = Date.now();
        if (
          !['up', 'down', 'left', 'right'].includes(direction) ||
          now - lastMoveAt < movementInterval
        ) {
          return;
        }
        lastMoveAt = now;
        player.movePlayer(direction, movementStep);
        player.x = Math.max(radius, Math.min(world.width - radius, player.x));
        player.y = Math.max(radius, Math.min(world.height - radius, player.y));

        for (let index = collectibles.length - 1; index >= 0; index -= 1) {
          if (player.collision(collectibles[index])) {
            player.score += collectibles[index].value;
            collectibles[index] = createCollectible(Collectible);
          }
        }
        broadcastState();
      });

      client.on('disconnect', () => {
        players.delete(client.id);
        broadcastState();
      });
    }).catch(error => {
      console.error('Unable to initialize multiplayer player:', error);
      client.disconnect(true);
    });
  });
}).catch(error => {
  console.error('Unable to initialize multiplayer game:', error);
});

module.exports = app; // For testing
