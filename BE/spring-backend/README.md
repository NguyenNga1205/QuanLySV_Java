# Student Management API (Spring Boot)

This backend is separate from the original `BE/Main.java` demo server.

## Requirements
- JDK 21
- Maven 3.9+
- Node.js 20.9+ for the frontend

## Run backend (terminal 1)
Open a terminal in `BE/spring-backend`:

PowerShell:
```powershell
$env:QLSV_ADMIN_USERNAME="admin"
$env:QLSV_ADMIN_PASSWORD="change-this-password"
mvn spring-boot:run
```

Backend listens at `http://localhost:8080`. Use the same username/password on the frontend login screen. Change the development password before using the application.

## Run frontend (terminal 2)
Open a second terminal in `FE`:

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

If the backend URL differs, create `FE/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```
Restart `npm run dev` after changing environment variables.

## API endpoints
- `GET /api/health` — health check, no login required
- `GET /api/students` — list students; optional `?keyword=...` search
- `GET /api/students/{id}` — student details
- `POST /api/students` — create student
- `PUT /api/students/{id}` — update student
- `DELETE /api/students/{id}` — delete student

## Limitations
- Student data is stored in memory and resets when the backend restarts.
- This is a coursework starter, not production-ready. Database persistence, classroom/faculty/course relationships and automated tests still need to be added.
- Run the Spring Boot backend on port 8080 for this frontend. The old demo server in `BE/Main.java` is separate.
