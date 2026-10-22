class Player {
  constructor({ x = 0, y = 0, score = 0, id, color } = {}) {
    this.id = id || `player-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.x = Number.isFinite(x) ? x : 0;
    this.y = Number.isFinite(y) ? y : 0;
    this.score = Number.isFinite(score) ? score : 0;
    this.color = color || '#43e6c3';
    this.radius = 15;
  }

  movePlayer(dir, speed) {
    if (!Number.isFinite(speed) || speed < 0) return;

    switch (dir) {
      case 'up':
        this.y -= speed;
        break;
      case 'down':
        this.y += speed;
        break;
      case 'left':
        this.x -= speed;
        break;
      case 'right':
        this.x += speed;
        break;
    }
  }

  collision(item) {
    if (
      !item ||
      !Number.isFinite(item.x) ||
      !Number.isFinite(item.y)
    ) {
      return false;
    }

    const itemRadius = Number.isFinite(item.radius) ? item.radius : 10;
    const radius = this.radius + itemRadius;
    return Math.hypot(this.x - item.x, this.y - item.y) <= radius;
  }

  calculateRank(arr) {
    const players = Array.isArray(arr) ? arr : [];
    const rank = players.filter(
      player => Number.isFinite(player.score) && player.score > this.score
    ).length + 1;

    return `Rank: ${rank}/${players.length}`;
  }
}

export default Player;
