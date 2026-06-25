FROM node:20-bookworm

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all Node dependencies
RUN npm install

# Install the Playwright Chromium browser and all required Linux OS dependencies
RUN npx playwright install --with-deps chromium

# Copy the rest of the application code
COPY . .

# Hugging Face Spaces require the container to run as a non-root user with UID 1000
RUN useradd -m -u 1000 user && \
    chown -R user:user /app

# Switch to the non-root user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Expose the default Hugging Face port
EXPOSE 7860

# Build Next.js UI for production
ENV NODE_ENV=production
RUN npm run build

# Start the combined Next.js + MCP server
CMD ["npm", "run", "mcp"]
