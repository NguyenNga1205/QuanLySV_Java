# Student Management API (Spring Boot)

This is a starter backend added alongside the existing `BE/Main.java`; it does not overwrite the current demo server.

## Requirements
- JDK 21
- Maven 3.9+ (or use the Maven wrapper if one is added later)

## Run
From this directory:

```bash
mvn spring-boot:run
```

The API listens on `http://localhost:8080`.

## Admin authentication
All endpoints except `GET /api/health` require HTTP Basic authentication.
Set credentials through environment variables before running:

PowerShell:
```powershell
$env:QLSV_ADMIN_USERNAME="admin"
$env:QLSV_ADMIN_PASSWORD="choose-a-long-local-password"
mvn spring-boot:run
```

The fallback password is only a development placeholder. Set your own value; do not deploy with the fallback.

## Endpoints
- `GET /api/health` — health check, no login required
- `GET /api/students` — list students; optional `?keyword=...` search
- `GET /api/students/{id}` — student details
- `POST /api/students` — create student
- `PUT /api/students/{id}` — update student
- `DELETE /api/students/{id}` — delete student

Example request body:
```json
{
  "fullName": "Nguyen Van A",
  "email": "a@example.com",
  "phoneNumber": "0900000000",
  "status": "STUDYING"
}
```

## Important current limitations
- Data is kept in memory, so it resets when the application restarts.
- This is a first backend scaffold, not a production-ready application. A database/repository layer, classroom/faculty/course relationships, automated tests, and a frontend login flow still need to be added.
- For local development, keep this API on port 8080 and run the existing Next.js app separately.
