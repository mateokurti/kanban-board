# Next.js Kanban Task Manager

This is a small Next.js (App Router) project implementing a Task/To‑Do manager with a Kanban board UI and a MongoDB backend (via Mongoose).

Purpose
- Demo app showing a full-stack Next.js App Router setup: route handlers, Mongoose models, client components, and a Kanban UI.

Key features
- Mongoose `Task` model: `title`, `description`, `status`, `priority`, `createdAt`, `updatedAt`.
- API routes under `app/api/tasks` supporting full CRUD.
- Client components: `TaskForm`, `TaskList`, `KanbanBoard`.
- Small client API wrapper in `lib/api/tasks.js`.

Quickstart (development)
1. Install dependencies

PowerShell
```
cd "c:\Users\User\Desktop\Andri\spms"
npm install
```

2. Environment

Create `.env.local` in the project root and set your MongoDB connection string. Example for a local MongoDB container or local server:

```
MONGODB_URI="mongodb://localhost:27017/kanban"
```

If you run Mongo in Docker Compose (recommended for reproducible local dev), see the `docker-compose.yml` in the repository — the `web` service expects `MONGODB_URI=mongodb://mongo:27017/kanban` by default.

3. Run dev server

PowerShell
```
npm run dev
```
Open http://localhost:3000

Docker (local)
- To run MongoDB + the web service via Docker Compose (development mode, code mounted):

PowerShell
```
cd "c:\Users\User\Desktop\Andri\spms"
docker compose up -d
```

The compose file includes a `mongo` service and a `web` service. The `web` service mounts the project and runs `npm run dev`.

API examples
- List tasks:
```
GET http://localhost:3000/api/tasks
```
- Create task (JSON):
```
POST http://localhost:3000/api/tasks
Content-Type: application/json
Body: { "title": "My task", "description": "Details", "priority": "high" }
```
- Update task:
```
PUT http://localhost:3000/api/tasks/<id>
Body: { "status": "in-progress" }
```
- Delete task:
```
DELETE http://localhost:3000/api/tasks/<id>
```

Development notes
- The Mongoose connection is centralized in `lib/db.js` and caches the connection on `globalThis` to avoid creating many connections during Next.js hot reload.
- The Task schema is at `lib/models/Task.js`.
- Kanban board moves tasks by updating the `status` field via the API.

Security & deployment
- Do not commit `.env.local` or any secrets. Use environment variables on your deployment platform.
- For production, use a production-ready Node image and a multi-stage Dockerfile. Enable Mongo auth and secure credentials.

Contributing
- Open an issue or submit a pull request. Add tests where appropriate.

License
- This project is provided under the MIT License — see `LICENSE`.
