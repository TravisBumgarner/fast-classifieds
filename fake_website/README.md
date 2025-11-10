# Fake Job Postings Website

A simple local website for testing the job scraper.

## Running the Server

```bash
# Option 1: Use the run script
./run.sh

# Option 2: Run node directly
node server.js
```

The website will be available at: http://localhost:3000

## Features

- Clean, styled job postings page
- 8 sample job listings
- IDs and classes for easy CSS selector testing
- Responsive table layout

## Useful CSS Selectors for Testing

- `.job-list` - The tbody containing all job rows
- `.job-row` - Individual job row
- `.job-title` - Job title text
- `#job-listings` - The entire job listings section
- `.jobs-table` - The table element

## Sample Jobs Included

1. Senior Software Engineer (San Francisco, CA)
2. Product Manager (New York, NY)
3. UX Designer (Remote)
4. DevOps Engineer (Austin, TX)
5. Data Scientist (Seattle, WA)
6. Marketing Manager (Los Angeles, CA)
7. Frontend Developer (Remote)
8. Customer Success Manager (Boston, MA)
