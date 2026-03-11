# Backend Engineering Assessment Starter

This repository is a standalone starter for the backend engineering take-home assessment.
It contains two independent services in a shared mono-repo:

- `python-service/` (InsightOps): FastAPI + SQLAlchemy + manual SQL migrations
- `ts-service/` (TalentFlow): NestJS + TypeORM

The repository is intentionally incomplete for assessment features. Candidates should build within the existing structure and patterns.

## Prerequisites

- Docker
- Python 3.12
- Node.js 22+
- npm

## Start Postgres

From the repository root:

```bash
docker compose up -d postgres
```

This starts PostgreSQL on `localhost:5432` with:

- database: `assessment_db`
- user: `assessment_user`
- password: `assessment_pass`

## Service Guides

- Python service setup and commands: [python-service/README.md](python-service/README.md)
- TypeScript service setup and commands: [ts-service/README.md](ts-service/README.md)

## Notes

- Keep your solution focused on the assessment tasks.
- Do not replace the project structure with a different architecture.

## Python service Documentation

The solution builds upon the provided starter structure and implements the InsightOps briefing report generation system in the Python service while preserving the monorepo architecture.

### Setup instructions
Prerequisites:
- Docker
- Python 3.12
#### Start PostgreSQL

`docker compose up -d postgres`

#### Running the Services

```
cd python-service

python3.12 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

#### Environment Variables should look like this

```
DATABASE_URL=postgresql+psycopg://assessment_user:assessment_pass@localhost:5432/assessment_db
APP_ENV=development
APP_PORT=8000
```

#### Run Database Migration

` python -m app.db.run_migrations up `

#### Start the service 
` python -m uvicorn app.main:app --reload --port 8000 `

## Steps to Create internal briefing reports

The Application starts running on `http://localhost:8000`

### Create a new Briefing
A new briefing can be created simply using this

```
curl -X POST "http://localhost:8000/briefings" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Luca Holdings",
    "ticker": "luca",
    "sector": "Industrial Technology",
    "analystName": "Jane Lorn",
    "summary": "Luca is benefiting from strong enterprise demand and improving operating leverage, though customer concentration remains a near term risk.",
    "recommendation": "Monitor for margin expansion and customer diversification before increasing exposure.",
    "keyPoints": [
      "Revenue grew 18% year-over-year in the latest quarter.",
      "Enterprise subscriptions now account for 62% of recurring revenue."
    ],
    "risks": [
      "Top two customers account for 41% of total revenue.",
      "International expansion may pressure margins over the next two quarters."
    ],
    "metrics": [
      { "name": "Revenue Growth", "value": "18%" },
      { "name": "Operating Margin", "value": "22.4%" }
    ]
  }'
```

You get a response with your report id which will be used to generate a report.

### Generate Briefing Report
A report can be generated easily using this

`curl -X POST "http://localhost:8000/briefings/1/generate" `

### View Generated report HTML
A Generated report can be viewed easily by adding this URL to the browser

`http://localhost:8000/briefings/1/html`

### Retrieve Stored Briefing

Briefing can be retrieved by sending this request

`curl -X GET "http://localhost:8000/briefings/1`

A postman collection that shows this in detail https://documenter.getpostman.com/view/14164448/2sBXiestyM#7730bc3c-372a-465d-afbe-3d22c383173c

### Assumptions or tradeoffs

1. HTML Storage in Database – Generated HTML is stored directly in the briefing table for simplicity and faster retrieval.

2. Limited Authentication / Authorization – No auth layer was implemented, assuming the assessment scope is focused on briefing creation and report generation.

3. Normalized Metrics – Metrics are stored in a normalized table to ensure data integrity and support potential analytical queries. This was chosen over a JSON blob for scalability and relational consistency.

### Design decisions: 
- Layered Architecture – The service is structured with clear separation of concerns: API routes handle requests, the service layer contains business logic, and ORM models interact with the database. This improves maintainability, testability, and clarity of responsibilities.

- Synchronous vs Asynchronous Tradeoff – Report generation occurs synchronously for simplicity, avoiding the overhead of background queues. While this is acceptable for small datasets, asynchronous processing would be preferred for high-volume production scenarios.

- View-Model Pattern for Reports – Briefings are transformed into a template-friendly view model before rendering Jinja templates.

### Schema decisions:
 - Validation via Pydantic Schemas – Input validation, required fields, and relational constraints are enforced in the schema layer, ensuring correctness before interacting with the database.

 - Timestamps and Flags – Fields like generated_at and generated track report creation and status,

- Normalized Database Design – Metrics, key points, and risks are modeled in 3NF (Third Normal Form), stored in normalized tables with relationships to the briefing. This enforces data integrity, supports complex relational queries, and allows easier future extensions or analytical operations.

### Future improvements:
Due to time constraints, the following enhancements were not implemented but would be valuable with more time:

- Downloading Reports as PDF
- Asynchronous Report Generation
- Multiple Templates Design