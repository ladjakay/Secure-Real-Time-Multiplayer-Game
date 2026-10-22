# Neon Drift

Neon Drift is a real-time multiplayer arcade game built with the HTML Canvas API, Express, and Socket.IO. Move around the shared arena with WASD or the arrow keys, collect glowing shards, and climb the live leaderboard.

## Run locally

1. Install dependencies with `npm install`.
2. Start the server with `npm start`.
3. Open `http://localhost:3000` in multiple browser tabs to play together.

The server owns player movement, arena boundaries, collectible placement, and score updates. Clients send only a movement direction; the server validates it and broadcasts the resulting game state. Disconnecting removes a player from the room.

## Security headers

Helmet 3 middleware sets `X-Content-Type-Options: nosniff`, the XSS protection header, and no-cache headers. The app disables Express's default powered-by value and sets the required `X-Powered-By: PHP 7.4.3` header.
