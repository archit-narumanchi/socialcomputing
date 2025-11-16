# 1. Base Image: Use a modern Node.js version
FROM node:20-slim

# 2. Install OpenSSL 1.1, which Prisma needs
RUN apt-get update && apt-get install -y openssl

# 3. Set working directory
WORKDIR /app

# 4. Copy package.json files
COPY package*.json ./

# 5. Copy Prisma schema FIRST
# This is so the 'postinstall' script in package.json can find it
COPY prisma ./prisma/

# 6. Install dependencies
# This will now ALSO run "npx prisma generate" successfully
RUN npm install

# 7. Copy the rest of your app's source code
COPY . .

# 8. Build the TypeScript code
RUN npm run build

# 9. Expose the port your app will run on
EXPOSE 8080

# 10. Set the default command to run your app
CMD [ "npm", "run", "start" ]