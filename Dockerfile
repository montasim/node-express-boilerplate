# Use a specific Node.js image
FROM node:18-slim

# Create app directory and set permissions for non-root user 'node'
RUN mkdir -p /usr/src/app && chown -R node:node /usr/src/app

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Switch to 'node' user for better security
USER node

# Install dependencies using Yarn
# Note: '--pure-lockfile' option is similar to '--frozen-lockfile' to ensure reproducibility
RUN yarn install --pure-lockfile

# Copy the rest of the application's source code with appropriate ownership
COPY --chown=node:node . .

# Build the app if necessary (uncomment if your app requires a build step)
# RUN yarn run build

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Define the command to run the app
CMD [ "node", "src/server.js" ]
