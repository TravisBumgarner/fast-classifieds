const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = 3000

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)

  // Serve index.html for root or any job detail page
  const filePath = path.join(__dirname, 'index.html')

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Error loading page')
      return
    }

    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(content)
  })
})

server.listen(PORT, () => {
  console.log(
    `🚀 Fake job postings website running at http://localhost:${PORT}`,
  )
  console.log(`Press Ctrl+C to stop the server`)
})
