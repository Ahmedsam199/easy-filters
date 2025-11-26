# Easy Filters

A powerful utility library for generating dynamic filters and query builders for Drizzle ORM with automatic Zod schema validation.

## Features

- 🔍 Dynamic filter generation based on column types
- ✅ Automatic Zod schema generation
- 🎯 Type-safe query building
- 📦 Support for multiple filter operations per column
- 🚀 Works with string, number, date, and boolean columns

## Installation

```bash
npm install easy-filters
```

## Peer Dependencies

This package requires:
- `drizzle-orm` >= 0.29.0
- `zod` >= 3.22.0

## Usage

### Basic Example

```typescript
import { generateFilterSchema, applyFilters } from 'easy-filters'
import { users } from './schema'

// Define which filters you want for each column
const filtersMap = {
  name: ['contains', 'eq', 'starts_with'],
  age: ['eq', 'gt', 'gte', 'lt', 'lte', 'between'],
  email: ['contains', 'eq'],
  createdAt: ['gte', 'lte', 'between'],
  isActive: ['eq']
}

// Generate Zod schema for validation
const FilterSchema = generateFilterSchema(users, filtersMap)

// Parse and validate query parameters
const queryParams = FilterSchema.parse({
  name_contains: 'Text',
  age_gte: 18,
  isActive_equals: true
})

// Apply filters to your Drizzle query
const whereClause = applyFilters(users, queryParams, filtersMap)

const results = await db
  .select()
  .from(users)
  .where(whereClause)
```

### Available Filters by Type

#### String Columns
- `contains` - Case-insensitive substring match
- `eq` - Exact match
- `starts_with` - Starts with pattern
- `ends_with` - Ends with pattern

#### Number Columns
- `eq` - Equal to
- `gt` - Greater than
- `gte` - Greater than or equal
- `lt` - Less than
- `lte` - Less than or equal
- `between` - Between two values (inclusive)

#### Date Columns
- `eq` - Equal to date
- `gte` - Greater than or equal
- `lte` - Less than or equal
- `between` - Between two dates

#### Boolean Columns
- `eq` - Equal to true/false

### API Reference

#### `generateFilterSchema(table, filtersMap)`

Generates a Zod schema based on your table and filter configuration.

**Parameters:**
- `table` - Drizzle table definition
- `filtersMap` - Object mapping column names to allowed filter operations

**Returns:** Zod schema object

#### `applyFilters(table, queryParams, filtersMap)`

Builds and applies filter conditions to your query.

**Parameters:**
- `table` - Drizzle table definition
- `queryParams` - Validated query parameters
- `filtersMap` - Object mapping column names to allowed filter operations

**Returns:** SQL condition that can be passed to `.where()`

#### `buildFilters(table, queryParams, filtersMap)`

Lower-level function that builds an array of SQL conditions.

**Parameters:**
- `table` - Drizzle table definition
- `queryParams` - Query parameters
- `filtersMap` - Object mapping column names to allowed filter operations

**Returns:** Array of SQL conditions

### Complete Example with Express

```typescript
import express from 'express'
import { drizzle } from 'drizzle-orm/node-postgres'
import { generateFilterSchema, applyFilters } from 'easy-filters'
import { users } from './schema'

const app = express()
const db = drizzle(process.env.DATABASE_URL!)

const filtersMap = {
  name: ['contains', 'eq'],
  age: ['gte', 'lte', 'between'],
  email: ['contains'],
  createdAt: ['gte', 'lte'],
  isActive: ['eq']
}

const FilterSchema = generateFilterSchema(users, filtersMap)

app.get('/users', async (req, res) => {
  try {
    // Validate query parameters
    const filters = FilterSchema.parse(req.query)
    
    // Apply filters
    const whereClause = applyFilters(users, filters, filtersMap)
    
    // Execute query
    const results = await db
      .select()
      .from(users)
      .where(whereClause)
    
    res.json(results)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})
```

### Example Query URLs

```
/users?name_contains=john&age_gte=18
/users?email_contains=@example.com&isActive_equals=true
/users?age_between_min=18&age_between_max=65
/users?createdAt_gte=2024-01-01&createdAt_lte=2024-12-31
```

## TypeScript Support

This package is written in TypeScript and includes type definitions out of the box.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please file an issue on the GitHub repository.