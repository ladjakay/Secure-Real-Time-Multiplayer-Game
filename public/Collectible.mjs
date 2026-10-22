class Collectible {
  constructor({ x = 0, y = 0, value = 1, id } = {}) {
    this.id = id || `collectible-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.x = Number.isFinite(x) ? x : 0;
    this.y = Number.isFinite(y) ? y : 0;
    this.value = Number.isFinite(value) && value > 0 ? value : 1;
    this.radius = 10;
  }

}

/*
  Note: Attempt to export this for use
  in server.js
*/
try {
  module.exports = Collectible;
} catch(e) {}

export default Collectible;
