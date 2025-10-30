# SQLhelper API Newman Tests

This directory contains Postman collections and environments for automated API testing using Newman.

## Files

- `sqlhelper.postman_collection.json` - Complete test suite with all API endpoints
- `sqlhelper.postman_environment.json` - Environment variables for local testing

## Test Coverage

### Health Check (1 test)
- API availability and response structure

### Dialect Detection (2 tests)
- MySQL detection
- PostgreSQL detection

### SQL Parsing (5 tests)
- MySQL DDL parsing
- PostgreSQL DDL parsing
- SQLite DDL parsing
- SQL Server DDL parsing
- Oracle DDL parsing

### Advanced Tests (5 tests)
- Auto-dialect detection
- Invalid SQL validation
- Unsupported dialect error handling
- Complex schema with relationships
- Performance test with large schema

**Total: 13 test scenarios with 60+ assertions**

## Prerequisites

Install Newman globally or as dev dependency:

```bash
# Global installation
npm install -g newman newman-reporter-htmlextra

# Or project-level (recommended)
npm install --save-dev newman newman-reporter-htmlextra
```

## Running Tests

### Using npm scripts

```bash
# Run all tests
npm run test:api

# Run with detailed output
npm run test:api:verbose

# Generate HTML report
npm run test:api:report
```

### Using Newman CLI directly

```bash
# Basic run
newman run postman/sqlhelper.postman_collection.json -e postman/sqlhelper.postman_environment.json

# With reporters
newman run postman/sqlhelper.postman_collection.json \
  -e postman/sqlhelper.postman_environment.json \
  -r cli,json,html \
  --reporter-html-export newman-report.html

# Specific folder only
newman run postman/sqlhelper.postman_collection.json \
  -e postman/sqlhelper.postman_environment.json \
  --folder "Dialect Detection"

# With iterations
newman run postman/sqlhelper.postman_collection.json \
  -e postman/sqlhelper.postman_environment.json \
  -n 3
```

## Environment Variables

Default environment uses `http://localhost:3000` as the base URL.

To test against a different environment:

```bash
newman run postman/sqlhelper.postman_collection.json \
  --env-var "baseUrl=https://api.production.com"
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run API Tests
  run: |
    npm install -g newman
    newman run postman/sqlhelper.postman_collection.json \
      -e postman/sqlhelper.postman_environment.json \
      -r cli,json \
      --reporter-json-export newman-results.json
```

### GitLab CI

```yaml
test:api:
  script:
    - npm install -g newman
    - newman run postman/sqlhelper.postman_collection.json -e postman/sqlhelper.postman_environment.json
```

## Test Results

Newman provides detailed output including:

- Total tests run
- Passed/Failed assertions
- Response times
- Error details

### Example Output

```
SQLhelper API

→ Health Check
  GET http://localhost:3000/health [200 OK, 250B, 45ms]
  ✓  Status code is 200
  ✓  Response has correct structure
  ✓  Status is healthy
  ✓  Response time is acceptable

→ Parse MySQL DDL
  POST http://localhost:3000/api/parse [200 OK, 2.5KB, 120ms]
  ✓  Status code is 200
  ✓  Response has success flag
  ✓  Response has data object
  ✓  Schema contains tables
  ✓  Metadata is present
  ✓  Dialect used is MySQL
  ✓  Tables found count is correct

┌─────────────────────────┬──────────┬──────────┐
│                         │ executed │   failed │
├─────────────────────────┼──────────┼──────────┤
│              iterations │        1 │        0 │
├─────────────────────────┼──────────┼──────────┤
│                requests │       13 │        0 │
├─────────────────────────┼──────────┼──────────┤
│            test-scripts │       26 │        0 │
├─────────────────────────┼──────────┼──────────┤
│      prerequest-scripts │       13 │        0 │
├─────────────────────────┼──────────┼──────────┤
│              assertions │       65 │        0 │
└─────────────────────────┴──────────┴──────────┘
```

## HTML Report

The HTML report (when using `htmlextra` reporter) includes:

- Summary dashboard with pass/fail statistics
- Timeline of requests
- Detailed test results
- Response time graphs
- Failed test details with request/response data

View the report by opening `newman-report.html` in a browser.

## Troubleshooting

### Server Not Running

Ensure the backend server is running on port 3000:

```bash
cd SQLhelper-back
npm run dev
```

### Port Already in Use

Change the port in the environment file or override via CLI:

```bash
newman run postman/sqlhelper.postman_collection.json \
  --env-var "baseUrl=http://localhost:3001"
```

### Tests Timing Out

Increase timeout in Newman:

```bash
newman run postman/sqlhelper.postman_collection.json \
  -e postman/sqlhelper.postman_environment.json \
  --timeout-request 10000
```

## Best Practices

1. **Run tests before commits**: Ensure all tests pass before pushing code
2. **Keep tests independent**: Each test should be self-contained
3. **Use environments**: Separate configs for dev, staging, production
4. **Monitor performance**: Check parseTimeMs and responseTime assertions
5. **Update tests with features**: Add tests when adding new endpoints

## Additional Resources

- [Newman Documentation](https://learning.postman.com/docs/running-collections/using-newman-cli/command-line-integration-with-newman/)
- [Postman Test Scripts](https://learning.postman.com/docs/writing-scripts/test-scripts/)
- [Newman Reporters](https://learning.postman.com/docs/running-collections/using-newman-cli/newman-built-in-reporters/)
