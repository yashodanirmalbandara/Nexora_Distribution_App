# Waypoint Logistics - Dispatcher Backend Service

This project contains the Dispatcher Portal backend services for Waypoint Logistics.

## Project Layout

```
.
├── prisma/
│   └── schema.prisma         # Prisma ORM Schema for PostgreSQL
├── src/
│   ├── routes/
│   │   └── dispatcher.ts     # Express endpoints for Dispatcher Portal
│   └── services/
│       └── pythonAllocator.ts # Child process wrapper for python route optimizer
├── scripts/
│   └── check_allocation.py  # Python allocation algorithm script
└── README.md
```

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install express @prisma/client
   npm install --save-dev typescript @types/express @types/node prisma
   ```

2. Initialize Prisma database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. Run the development server:
   ```bash
   npx ts-node src/index.ts
   ```
