# RPC Backend

Renovation Pricing Calculator — NestJS backend for parsing Excel files, running the calculation engine, persisting results, and generating PDF reports.

---

## Tech Stack

- **NestJS**
- **TypeScript**
- **TypeORM**
- **PostgreSQL** (hosted on Supabase)
- **exceljs** (Excel parsing)
- **Puppeteer** (PDF generation)
- **@sparticuz/chromium** (Chromium for production/Render)
- **@nestjs/swagger** (API documentation)
- **class-validator + class-transformer** (DTO validation)

---

## Prerequisites

- Node.js v20 LTS (recommended)
- npm v10+
- A Supabase project with a PostgreSQL database
- Google Chrome installed locally (for PDF generation in development)

---

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment template and fill in values
cp .env.example .env

# Start development server
npm run start:dev
```

The API runs at `http://localhost:3001`.  
Swagger UI is available at `http://localhost:3001/api`.

---

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

PORT=3001
NODE_ENV=development
```

> The connection string uses Supabase's **PgBouncer pooler URL** (port 6543), not the direct connection. This is the format that works with TypeORM + Supabase. Find it in your Supabase dashboard under **Project → Connect → Transaction pooler**.

---

## Project Structure

```
src/
├── main.ts                             # Bootstrap, Swagger, ValidationPipe, CORS
├── app.module.ts                       # Root module
├── config/
│   └── configuration.ts               # @nestjs/config schema
├── database/
│   └── database.module.ts             # TypeORM config with SSL for Supabase
└── modules/
    ├── upload/
    │   ├── upload.module.ts
    │   ├── upload.controller.ts        # POST /upload/parse
    │   └── upload.service.ts           # exceljs parser → returns JSON, no DB write
    ├── project/
    │   ├── project.module.ts
    │   ├── project.controller.ts       # POST /project/calculate, GET /project/:id
    │   ├── project.service.ts          # Orchestrates save, calculate, persist
    │   ├── entities/
    │   │   ├── project.entity.ts
    │   │   ├── room.entity.ts
    │   │   ├── material.entity.ts
    │   │   ├── project-material.entity.ts
    │   │   └── calculation-log.entity.ts
    │   └── dto/
    │       ├── create-project.dto.ts
    │       ├── room.dto.ts
    │       └── material.dto.ts
    ├── calculation/
    │   ├── calculation.module.ts
    │   ├── calculation.service.ts      # Formula engine
    │   └── types/
    │       └── calculation.types.ts    # FormulaStep, CalculationResult
    └── export/
        ├── export.module.ts
        ├── export.controller.ts        # POST /project/:id/pdf
        ├── export.service.ts           # Puppeteer PDF generation
        └── types/
            └── chromium.d.ts           # Type declarations for @sparticuz/chromium
```

---

## API Endpoints

Full interactive documentation is available at `http://localhost:3001/api` via Swagger UI.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload/parse` | Parse an uploaded Excel file. Returns JSON — does **not** save to DB. |
| `POST` | `/project/calculate` | Submit rooms + materials, run calculation, save to DB, return full result. |
| `GET` | `/project/:id` | Fetch a saved project with rooms, materials, and latest formula trace. |
| `POST` | `/project/:id/pdf` | Generate and download a PDF report for a project. |

---

## Database

TypeORM connects to Supabase PostgreSQL with SSL enabled. `synchronize` is set to `false` — tables must be created via migrations. The connection pool is capped at 10 connections (`extra.max: 10`) which is appropriate for Supabase's free tier limits.

### Entities

| Entity | Description |
|--------|-------------|
| `ProjectEntity` | Top-level project record with `inputSource`, `totalPrice`, `status` |
| `RoomEntity` | Room dimensions and computed `sqft`, `roomTotal`. FK → Project |
| `MaterialEntity` | Reusable material with `unitPrice`, `qtyPerSqft` |
| `ProjectMaterialEntity` | Join table linking materials to a project with `totalQuantity`, `totalCost` |
| `CalculationLogEntity` | Versioned log storing `formulaTrace` as JSONB |

### Indexes

- `Room.projectId`
- `ProjectMaterial.projectId`
- `CalculationLog.projectId`
- `Project.createdAt`

---

## Calculation Engine

The `CalculationService` is the core of the app. Given rooms and materials it:

1. Computes `sqft = width × height` per room
2. Computes material contribution per room: `sqft × qtyPerSqft × unitPrice`
3. Sums contributions across all rooms per material
4. Returns a `CalculationResult` with a full `FormulaStep[]` trace

Every single arithmetic step generates a `FormulaStep`:

```ts
interface FormulaStep {
  label: string       // e.g. "Living Room sqft"
  expression: string  // e.g. "14 × 12"
  result: number      // e.g. 168
  unit: string        // e.g. "sqft" or "$"
}
```

This trace is stored as JSONB in `CalculationLog` and returned to the frontend for display in the Formula Viewer.

---

## PDF Generation

PDF generation uses a dual-environment strategy in `ExportService`:

**Development** — uses the locally installed `puppeteer` package which bundles its own Chromium, or falls back to your system Chrome:
```ts
// src/modules/export/export.service.ts
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
```

**Production (Render)** — uses `@sparticuz/chromium` which provides a Lambda/serverless-compatible Chromium binary:
```ts
const executablePath = await chromium.executablePath();
browser = await puppeteerCore.launch({
  args: [...chromium.args],
  executablePath,
  headless: chromium.headless,
});
```

The environment is detected via `process.env.NODE_ENV`.

To install Puppeteer without downloading Chromium (recommended for dev on slow connections):
```bash
PUPPETEER_SKIP_DOWNLOAD=true npm install puppeteer
```

---

## Excel File Format

The upload parser (`upload.service.ts`) expects:

**Sheet 1 — `Rooms`**
| Room Name | Width (ft) | Height (ft) |
|-----------|------------|-------------|
| Living Room | 14 | 12 |

**Sheet 2 — `Materials`**
| Material Name | Unit | Unit Price | Qty Per SqFt |
|---------------|------|------------|--------------|
| Paint | gallon | 48.00 | 0.045 |

If sheets or columns are missing, a `400 Bad Request` is returned with a descriptive message. A sample file (`renovation_sample.xlsx`) is included in the repo.

---

## Validation

A global `ValidationPipe` is configured in `main.ts` with `whitelist: true` and `forbidNonWhitelisted: true`. All DTOs use `class-validator` decorators. Requests with missing or invalid fields return a structured `400` response.

---

## Available Scripts

```bash
npm run start:dev     # Development with hot reload
npm run start:prod    # Production (runs compiled output)
npm run build         # Compile TypeScript to /dist
npm run lint          # Run ESLint
npm run test          # Run unit tests
```

---

## Deployment (Render)

1. Push to GitHub
2. Create a new **Web Service** on Render
3. Set build command: `npm install && npm run build`
4. Set start command: `node dist/main`
5. Add all environment variables from `.env` in the Render dashboard
6. Set `NODE_ENV=production`
7. Set `synchronize=false` in `database.module.ts` and run migrations before first deploy

> Render's free tier spins down after inactivity. The first request after sleep may take 30–60 seconds.