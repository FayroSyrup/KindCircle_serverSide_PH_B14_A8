# KindCircle Server

Express and MongoDB API for the KindCircle community events platform.

## Routes
- GET /events (upcoming only, supports q, type, limit)
- GET /events/:id
- GET /events/mine (JWT)
- POST /events (JWT)
- PUT /events/:id (JWT, owner only)
- DELETE /events/:id (JWT, owner only)
- POST /joins (JWT)
- GET /joins/mine (JWT)

JWT tokens come from Better Auth on the client app and are checked here with its public keys.

## Run
npm i, copy .env.example to .env, then npm run dev