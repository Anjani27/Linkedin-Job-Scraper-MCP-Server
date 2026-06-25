FROM node:20-bookworm

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all Node dependencies
RUN npm install

# Set Playwright browser path to a shared directory
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Install the Playwright Chromium browser and all required Linux OS dependencies
RUN npx playwright install --with-deps chromium

# Copy the rest of the application code
COPY . .

# Hugging Face Spaces require the container to run as a non-root user with UID 1000
# The official Node image already has a "node" user with UID 1000.
RUN chown -R node:node /app /ms-playwright

# Switch to the non-root user
USER node
ENV HOME=/home/node \
    PATH=/home/node/.local/bin:$PATH

# Expose the default Hugging Face port
EXPOSE 7860

# Build Next.js UI for production
ENV NODE_ENV=production
RUN npm run build

# Start the combined Next.js + MCP server
CMD ["npm", "run", "mcp"]
