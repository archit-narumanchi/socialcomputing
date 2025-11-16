# 1. Base Image: Use a modern Node.js version
FROM node:20-slim

# 2. Install OpenSSL 1.1, which Prisma needs
RUN apt-get update && apt-get install -y openssl

# 3. Set working directory
WORKDIR /app

# 4. Copy package.json and install dependencies
# This will now ALSO run "npx prisma generate" because of our postinstall script
COPY package*.json ./
RUN npm install

# 5. Copy Prisma schema
COPY prisma ./prisma/

# 6. Copy the rest of your app's source code
COPY . .

# 7. Build the TypeScript code
RUN npm run build

# 8. Expose the port your app will run on
EXPOSE 8080

# 9. Set the default command to run your app
CMD [ "npm", "run", "start" ]