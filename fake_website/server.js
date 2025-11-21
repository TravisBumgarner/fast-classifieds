const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const PORT = 80

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)

  let filePath

  // Route handling
  if (req.url === '/' || req.url === '/index.html') {
    filePath = path.join(__dirname, 'index.html')
  } else if (req.url.startsWith('/jobs/')) {
    // Extract job name from URL (e.g., /jobs/frontend-developer)
    const jobName = req.url.split('/jobs/')[1]
    filePath = path.join(__dirname, 'jobs', `${jobName}.html`)
  } else {
    // For any other route, serve index.html
    filePath = path.join(__dirname, 'index.html')
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found, serve 404
        res.writeHead(404, { 'Content-Type': 'text/html' })
        res.end('<h1>404 - Page Not Found</h1><p><a href="/">Back to Jobs</a></p>')
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' })
        res.end('Error loading page')
      }
      return
    }

    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(content)
  })
})

server.listen(PORT, () => {
  console.log(`🚀 Fake job postings website running at http://localhost:${PORT}`)
  console.log(`Press Ctrl+C to stop the server`)
})
