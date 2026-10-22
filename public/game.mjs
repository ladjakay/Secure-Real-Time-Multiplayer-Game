import Player from './Player.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');
const status = document.getElementById('connection-status');
const connectionDot = document.getElementById('connection-dot');
const rankDisplay = document.getElementById('rank');
const scoreDisplay = document.getElementById('score');
const playersDisplay = document.getElementById('players');
const width = canvas.width;
const height = canvas.height;
const players = new Map();
let collectibles = [];
let currentPlayerId = null;
let latestState = null;

const keyDirections = {
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right'
};

socket.on('connect', () => {
  currentPlayerId = socket.id;
  status.textContent = 'Connected';
  connectionDot.classList.add('is-connected');
});

socket.on('disconnect', () => {
  currentPlayerId = null;
  status.textContent = 'Reconnecting…';
  connectionDot.classList.remove('is-connected');
});

socket.on('game:state', state => {
  if (!state || !Array.isArray(state.players) || !Array.isArray(state.collectibles)) {
    return;
  }

  latestState = state;
  players.clear();
  state.players.forEach(player => {
    if (
      player &&
      typeof player.id === 'string' &&
      Number.isFinite(player.x) &&
      Number.isFinite(player.y) &&
      Number.isFinite(player.score)
    ) {
      players.set(player.id, new Player(player));
    }
  });
  collectibles = state.collectibles.filter(item =>
    item &&
    typeof item.id === 'string' &&
    Number.isFinite(item.x) &&
    Number.isFinite(item.y)
  );
  updateScoreboard();
});

document.addEventListener('keydown', event => {
  const direction = keyDirections[event.key];
  if (!direction) return;
  event.preventDefault();
  if (socket.connected) socket.emit('game:move', direction);
});

function updateScoreboard() {
  const player = players.get(currentPlayerId);
  scoreDisplay.textContent = player ? String(player.score) : '0';
  rankDisplay.textContent = player && latestState
    ? player.calculateRank(latestState.players)
    : 'Rank: --/--';

  const rankedPlayers = [...players.values()].sort((a, b) => b.score - a.score);
  playersDisplay.replaceChildren();
  rankedPlayers.forEach((rankedPlayer, index) => {
    const row = document.createElement('li');
    const name = document.createElement('span');
    const score = document.createElement('strong');
    name.textContent = rankedPlayer.id === currentPlayerId
      ? 'You'
      : `Player ${index + 1}`;
    score.textContent = String(rankedPlayer.score);
    row.append(name, score);
    playersDisplay.append(row);
  });
}

function drawBackground() {
  context.fillStyle = '#101b2d';
  context.fillRect(0, 0, width, height);
  context.strokeStyle = 'rgba(116, 149, 190, 0.09)';
  context.lineWidth = 1;
  for (let x = 24; x < width; x += 48) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 24; y < height; y += 48) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
}

function drawCollectible(item, time) {
  const pulse = 1 + Math.sin(time / 180 + item.x) * 0.12;
  context.save();
  context.translate(item.x, item.y);
  context.rotate(Math.PI / 4);
  context.fillStyle = '#ffb86b';
  context.shadowColor = '#ff9f43';
  context.shadowBlur = 16;
  context.fillRect(-8 * pulse, -8 * pulse, 16 * pulse, 16 * pulse);
  context.restore();
}

function drawPlayer(player) {
  context.save();
  context.translate(player.x, player.y);
  context.fillStyle = player.color;
  context.shadowColor = player.color;
  context.shadowBlur = player.id === currentPlayerId ? 20 : 10;
  context.beginPath();
  context.moveTo(0, -player.radius);
  context.lineTo(player.radius, 0);
  context.lineTo(0, player.radius);
  context.lineTo(-player.radius, 0);
  context.closePath();
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = '#101b2d';
  context.beginPath();
  context.arc(0, 0, 4, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#eaf2ff';
  context.font = '12px system-ui, sans-serif';
  context.textAlign = 'center';
  context.fillText(player.id === currentPlayerId ? 'YOU' : 'PLAYER', 0, -22);
  context.restore();
}

function render(time) {
  drawBackground();
  collectibles.forEach(item => drawCollectible(item, time));
  players.forEach(drawPlayer);
  requestAnimationFrame(render);
}

requestAnimationFrame(render);
