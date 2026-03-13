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

---
TYPESCRIPT SERVICE DOCUMENTATION - CANDIDATE INTAKE & SUMMARY WORKFLOW
---

This is a documentation of the Candidate Document Intake + Summary Service

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- npm

### Install Dependencies
```bash
cd ts-service
npm install
```

## Start PostgreSQL

### Using Docker Compose (from root directory)
```bash
docker compose up -d postgres
```

This starts PostgreSQL on:
- Host: localhost
- Port: 5432
- Database: assessment_db
- Username: assessment_user
- Password: assessment_pass

### Getting Gemini API Key
1. Visit: https://aistudio.google.com/app/apikey
2. Click "Get API Key" or "Create API Key"
3. Copy the key and add to .env as GEMINI_API_KEY

## Environment Variables

Create a .env file in ts-service/ with:

```
DATABASE_URL=postgres://assessment_user:assessment_pass@localhost:5432/assessment_db
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
PORT=3000
```

## Run Database Migration

```
cd ts-service
npm run migration:run
```

## Running the Services

### Start Development Server
```bash
npm run start:dev
```

Server runs on: http://localhost:3000

### Show Migration Status

```bash
npm run migration:show
```

### Revert Last Migration
```bash
npm run migration:revert
```

### Test Data Seeded
The SeedRecruitersAndWorkspaces migration creates:

Workspaces:
- ID: '1', Name: 'Workspace 1'
- ID: '2', Name: 'Workspace 2'

Recruiters (test users):
- ID: '1', Workspace: '1'
- ID: '2', Workspace: '2'
- ID: '3', Workspace: '1'
- ID: '4', Workspace: '2'

Use these for authentication headers in API calls.

## Authentication

All endpoints require FakeAuthGuard with headers:

Headers Required:
```
x-user-id: <recruiter_id>
x-workspace-id: <workspace_id>
```

Example (User 1 in Workspace 1):
```
x-user-id: 1
x-workspace-id: 1
```

Access Control:
- Recruiters can only access candidates in their workspace
- Database queries filter by workspace_id automatically
- Unauthorized requests return 401 UnauthorizedException

## Steps to Create a Candidate

Endpoint: POST /candidates
Headers: x-user-id, x-workspace-id
Content-Type: application/json

Request Body:
```json
{
  "fullName": "John Doe",
  "email": "john@example.com"
}
```

Example with cURL:
```bash
curl -X POST http://localhost:3000/candidates \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -H "x-workspace-id: 1" \
  -d '{
    "fullName": "Jane Smith",
    "email": "jane@example.com"
  }'
```

Response (201 Created):
```json
{
  "id": "uuid-here",
  "workspaceId": "1",
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "createdAt": "2026-03-13T00:00:00.000Z"
}
```

## Upload a Document

Endpoint: POST /candidates/:candidateId/documents
Headers: x-user-id, x-workspace-id
Content-Type: application/json

Request Body:
```json
{
  "documentType": "resume",
  "fileName": "jane_resume.pdf",
  "rawText": "Full text content of the document here..."
}
```

Example:
```bash
curl -X POST http://localhost:3000/candidates/candidate-id-here/documents \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -H "x-workspace-id: 1" \
  -d '{
    "documentType": "resume",
    "fileName": "resume.txt",
    "rawText": "Professional Summary: 10 years in software engineering..."
  }'
```

Response (201 Created):
```json
{
  "id": "document-uuid",
  "candidateId": "candidate-id",
  "documentType": "resume",
  "fileName": "resume.txt",
  "storageKey": "candidates/candidate-id/documents/doc-id/timestamp.txt",
  "uploadedAt": "2026-03-13T00:00:00.000Z"
}
```

Note:
- At least 1 document required before requesting summary
- Text content stored in database (rawText field)

## Request Summary Generation

Endpoint: POST /candidates/:candidateId/summaries/generate
Headers: x-user-id, x-workspace-id
Method: POST (empty body or empty object)

Request:
```bash
curl -X POST http://localhost:3000/candidates/candidate-id-here/summaries/generate \
  -H "x-user-id: 1" \
  -H "x-workspace-id: 1"
```

Response (202 Accepted):
```json
{
  "id": "summary-uuid",
  "candidateId": "candidate-id",
  "status": "pending",
  "score": null,
  "strengths": [],
  "concerns": [],
  "summary": null,
  "recommendedDecision": null,
  "provider": "gemini-pro",
  "promptVersion": 1,
  "errorMessage": null,
  "createdAt": "2026-03-13T00:00:00.000Z",
  "updatedAt": "2026-03-13T00:00:00.000Z"
}
```

What Happens:
1. Creates pending summary record in database
2. Enqueues background job in queue_jobs table
3. Returns immediately (202 status = accepted for processing)
4. QueueWorker picks up job asynchronously
5. Worker fetches documents, calls Gemini API, updates summary

Processing Time:
- Typically 2-5 seconds depending on API response
- Check status by getting the summary (see next section)

## List Candidate Summaries

Endpoint: GET /candidates/:candidateId/summaries
Headers: x-user-id, x-workspace-id

Request:
```bash
curl http://localhost:3000/candidates/candidate-id-here/summaries \
  -H "x-user-id: 1" \
  -H "x-workspace-id: 1"
```

Response (200 OK):
```json
[
  {
    "id": "summary-uuid",
    "candidateId": "candidate-id",
    "status": "completed",
    "score": 82,
    "strengths": [
      "Strong technical background",
      "Leadership experience",
      "Clear communication skills"
    ],
    "concerns": [
      "Limited experience with React",
      "No DevOps background"
    ],
    "summary": "Jane is a solid software engineer with strong fundamentals...",
    "recommendedDecision": "INTERVIEW",
    "provider": "gemini-pro",
    "promptVersion": 1,
    "errorMessage": null,
    "createdAt": "2026-03-13T00:00:00.000Z",
    "updatedAt": "2026-03-13T00:05:00.000Z"
  }
]
```

## Get Summary for Candidate

Endpoint: GET /candidates/:candidateId/summaries/:summaryId
Headers: x-user-id, x-workspace-id

Request:
```bash
curl http://localhost:3000/candidates/candidate-id-here/summaries/summary-id-here \
  -H "x-user-id: 1" \
  -H "x-workspace-id: 1"
```

Response (200 OK):
```json
{
  "id": "summary-uuid",
  "candidateId": "candidate-id",
  "status": "completed",
  "score": 82,
  "strengths": ["..."],
  "concerns": ["..."],
  "summary": "Jane is a solid software engineer...",
  "recommendedDecision": "INTERVIEW",
  "createdAt": "2026-03-13T00:00:00.000Z",
  "updatedAt": "2026-03-13T00:05:00.000Z"
}
```

## Design Decisions

### 1. Database Schema - Normalized Design

Recruiters Table:
- Single primary key (id) to ensure global uniqueness
- Foreign key to sample_workspaces (onDelete: CASCADE)
- Access control mechanism for workspace isolation

Design Rationale:
- Composite key (id, workspace_id) not needed since workspace_id is already FK

### 2. Queue/Worker Architecture

Asynchronous Summary Generation:
- Summary requests immediately return 202 (Accepted) response
- Jobs enqueued in queue_jobs table
- Separate QueueWorker picks up jobs and processes them
- Status field tracks: pending → completed/failed

Why This Approach:
- LLM API calls can take 2-5 seconds
- Don't block HTTP requests waiting for LLM response
- Users get immediate feedback (job accepted)
- Failure handling - jobs can be retried if worker crashes

### 3. LLM Provider Abstraction

SummarizationProvider Interface:
- Two implementations: GeminiSummarizationProvider (real) and FakeSummarizationProvider (testing)
- Easy to swap providers or add new ones (e.g., OpenAI, Claude)

### 4. Structured Output Validation

LLM Response Format:
- Request structured JSON format from Gemini API
- Validate response against expected schema before saving
- Graceful error handling if response is malformed
- Error message saved to database for debugging

Schema Validation:
```
{
  score: number (0-100),
  strengths: string[],
  concerns: string[],
  summary: string,
  recommendedDecision: 'advance' | 'hold' |'reject'
}
```

### 5. Access Control Pattern

Workspace Isolation:
- FakeAuthGuard validates recruiter exists in workspace
- Service layer checks candidate belongs to user's workspace
- Queries filter by workspace_id at database level


Current Approach:
- Documents stored in database as text (practical for MVP)
- Future: Can externalize large files to blob storage


## Assumptions and Limitations

### Current Assumptions

1. Authentication
   - FakeAuthGuard is for testing/demo purposes only
   - In production, replace with JWT or OAuth
   - x-user-id and x-workspace-id headers used for simplicity

2. File Storage
   - Document text is embedded in database
   - Works well for text documents (resumes, cover letters)
   - Not suitable for binary files or very large documents (>1MB)

3. LLM Availability
   - Requires active internet connection to Gemini API
   - API key must be valid and not rate-limited
   - Assumes Gemini API is available and responding

### Known Limitations

1. LLM Prompt Engineering
   - Gemini API response quality varies with input quality

4. Performance
   - No pagination on list endpoints (all summaries returned)

5. Scalability
   - Single queue worker handles all jobs sequentially
   - Document retrieval fetches all documents for every summary request
   - No caching layer (Redis, etc.)

### Data Limitations

1. Document Text Encoding
   - Assumes UTF-8 text in documents
   - Binary files (PDFs) not supported (text not extracted)

2. Recruiter Management
   - No recruiter creation endpoint (seeded via migration)
   - No way to add recruiters after deployment
   - No deactivation or deletion (via cascade on workspace delete only)

## LLM API/Provider Configuration

### Which LLM: Google Gemini Flash

Provider: Google AI Studio / Generative AI API
Model: gemini-flash
Endpoint: https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent

### Why Gemini?

1. Free tier with generous quota 
2. Excellent for document analysis and summarization
3. Production-ready API
4. Easy setup

### Quick Setup (5 minutes)

Step 1: Get Free API Key
```
1. Visit: https://aistudio.google.com/app/apikey
2. Click "Create API Key" (if not already created)
3. Copy the key
```

Step 2: Add to Environment
```
# In .env file
GEMINI_API_KEY=paste_your_key_here
```

Step 3: Verify Setup
```bash
npm run start:dev
# Check logs - should see successful startup without errors
# First summary request should complete in 2-5 seconds
```

### Configuration Details

Environment Variables:
- GEMINI_API_KEY: Your API key from Google AI Studio

Implementation Files:
- src/llm/gemini-summarization.provider.ts - Real provider (calls Gemini API)
- src/llm/llm.module.ts - Provider registration and selection

Request Format:
```
POST https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}

Body:
{
  "contents": [{
    "parts": [{
      "text": "Analyze this candidate resume and provide structured JSON response..."
    }]
  }],
  "generationConfig": {
    "temperature": 0.7
     "maxOutputTokens": 2048,
  }
}
```

Monitoring:
- Check usage in Google AI Studio dashboard
- API will return 429 if rate limit exceeded


## Future Improvements

1. Recruiter Management
   - Implement POST /recruiters endpoint
   - Allow adding/removing recruiters without migration
   - Reset recruiter credentials

2. Production Authentication
   - Replace FakeAuthGuard with JWT
   - Implement refresh tokens
   - Add password/credential management

3. File Storage
   - Support document uploads (multipart/form-data)
   - Store files in cloud (S3/GCS) instead of database
   - Extract text from PDF files

4. Job Retries
   - Implement automatic retry logic for failed jobs

5. Pagination
   - Add limit/offset to list endpoints
   - Return total count and metadata
   - Handle large result sets efficiently

6. Caching
   - Add Redis for candidate/summary caching
   - Cache Gemini API responses to reduce costs
   - Cache lookups by workspace

8. Advanced Search
   - Full-text search on summaries
   - Filter summaries by status, score, decision
   - Search across candidates and documents

9. Document Processing
   - PDF text extraction
   - Image OCR for scanned documents
   - Multi-language support

10. Compliance & Security
    - Data encryption at rest