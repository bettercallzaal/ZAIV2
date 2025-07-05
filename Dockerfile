FROM node:20-slim

WORKDIR /app

# Copy files
COPY ./bundle/ /app/bundle/
COPY ./debug.js /app/debug.js

# Create combined script for both debug and healthcheck
RUN echo 'const http = require("http"); \n\
const server = http.createServer((req, res) => { \n\
  res.writeHead(200, { "Content-Type": "text/plain" }); \n\
  res.end("ZAO AI Bot is running"); \n\
}); \n\
\n\
server.listen(process.env.PORT || 8080); \n\
console.log("Healthcheck server running on port 8080");\n\
\n\
// Debug output\n\
console.log("\n\n==== DEBUGGING ELIZAOS BOT ====");\n\
console.log("Node.js version:", process.version);\n\
console.log("Current directory:", process.cwd());\n\
console.log("Environment variables:", Object.keys(process.env));\n\
\n\
console.log("\nAttempting to load bundled bot...");\n\
try {\n\
  require("./bundle/bundle.cjs");\n\
  console.log("Bundle loaded successfully!");\n\
} catch (error) {\n\
  console.error("ERROR LOADING BUNDLE:", error);\n\
  console.error(error.stack);\n\
}' > /app/combined.js

# Expose port for healthcheck
EXPOSE 8080

# Run with full logging
CMD ["node", "/app/combined.js"]
