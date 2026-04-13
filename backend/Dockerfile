FROM node:20-slim

WORKDIR /usr/src/app

# Install Docker CLI so the Node backend can orchestrate containers
# We use bullseye instead of alpine because Docker CLI installation is much simpler
RUN apt-get update && \
    apt-get install -y ca-certificates curl gnupg && \
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    chmod a+r /etc/apt/keyrings/docker.gpg && \
    echo \
      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
      bullseye stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce-cli

COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 8000

# Start server directly (avoiding nodemon for production builds)
CMD ["node", "src/server.js"]
