# RAHBAR API

A robust Fastify + TypeScript API for managing religious content (Payam, Quran) with PostgreSQL backend, comprehensive request logging, and PDF file upload support.

## 📋 Features

- **Fastify Framework**: High-performance web framework with built-in logging
- **TypeScript**: Strict type checking for reliability
- **PostgreSQL + Sequelize**: Robust ORM with proper migrations support
- **Request Logging**: Every request logged with timing and structured data
- **PDF Upload**: Support for PDF file uploads with validation
- **Gujarati Font Conversion**: Automatic conversion from Gopika font to Unicode
- **Soft Deletes**: No data loss with isActive flag
- **Pagination & Filtering**: Built-in support for list queries

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env

# Edit .env with your database credentials
nano .env  # or use your preferred editor
```

### Configuration

Edit `.env` file with your settings:

```env
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rahbar_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# Logging
LOG_LEVEL=info

# File Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

### Create Database

```sql
-- Run in PostgreSQL
CREATE DATABASE rahbar_db;
```

### Run the Application

```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Payam Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payam` | List all payam (paginated) |
| GET | `/api/payam/:id` | Get single payam by ID |
| POST | `/api/payam` | Create new payam |
| PUT | `/api/payam/:id` | Update payam |
| DELETE | `/api/payam/:id` | Soft delete payam |

### Quran Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quran` | List all entries (paginated) |
| GET | `/api/quran/:id` | Get single entry by ID |
| GET | `/api/quran/surah/:surahNumber` | Get all ayahs of a surah |
| POST | `/api/quran` | Create new entry |
| PUT | `/api/quran/:id` | Update entry |
| DELETE | `/api/quran/:id` | Soft delete entry |

## 📝 Request Examples

### Create Payam (JSON)
```bash
curl -X POST http://localhost:3000/api/payam \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Example Payam",
    "content": "Content in Gujarati...",
    "category": "spiritual",
    "author": "Author Name"
  }'
```

### Create Payam with PDF
```bash
curl -X POST http://localhost:3000/api/payam \
  -F "title=Example Payam" \
  -F "category=spiritual" \
  -F "file=@./document.pdf"
```

### List with Pagination
```bash
curl "http://localhost:3000/api/payam?page=1&pageSize=20&category=spiritual"
```

## 📁 Project Structure

```
src/
├── index.ts              # Entry point with graceful shutdown
├── app.ts                # Fastify app factory
├── config/
│   ├── index.ts          # Configuration loader
│   └── database.ts       # Sequelize configuration
├── plugins/
│   └── logger.ts         # Request logging plugin
├── models/
│   ├── index.ts          # Model registry
│   ├── base.model.ts     # Common fields
│   ├── payam.model.ts    # Payam content
│   └── quran.model.ts    # Quran content
├── routes/
│   ├── index.ts          # Route aggregator
│   ├── payam.routes.ts   # Payam CRUD
│   └── quran.routes.ts   # Quran CRUD
├── schemas/
│   ├── payam.schema.ts   # Payam validation
│   └── quran.schema.ts   # Quran validation
├── services/
│   ├── payam.service.ts  # Payam business logic
│   └── quran.service.ts  # Quran business logic
└── utils/
    ├── file-handler.ts   # PDF/file utilities
    ├── gujarati-converter.ts # Gopika to Unicode
    └── response.ts       # Standardized responses
```

## 🔧 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run db:sync` | Sync database models |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## 🛡️ Error Handling

All responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [ ... ]
  }
}
```

## 📊 Logging

Request logs are structured JSON in production:
```json
{
  "level": "info",
  "time": "2024-01-01T12:00:00.000Z",
  "requestId": "abc-123",
  "method": "GET",
  "url": "/api/payam",
  "statusCode": 200,
  "responseTime": 45.23
}
```

In development, logs are pretty-printed for readability.

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Use Prettier for formatting
3. Write descriptive commit messages
4. Test thoroughly before submitting

## 📄 License

ISC