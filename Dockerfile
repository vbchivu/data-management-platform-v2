# Dockerfile

FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Define a build-time argument with a default value
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Copy package.json and package-lock.json
COPY package*.json ./

# Conditionally install dependencies based on NODE_ENV
RUN if [ "$NODE_ENV" = "development" ]; then \
    npm install; \
    else \
    npm ci --omit=dev; \
    fi

# Copy the rest of the application code
COPY . .

# Expose the port
EXPOSE 8000

# Default command (overridden in docker-compose)
CMD ["npm", "start"]
