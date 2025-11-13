# 1. "FROM node:20-slim"
# Start with a clean, lightweight Linux computer that already has
# Node.js (version 20) pre-installed.
FROM node:20-slim

# 2. "WORKDIR /app"
# Create a folder inside this new computer called '/app'
# and make it our primary working directory.
WORKDIR /app

# 3. "COPY package*.json ./"
# Find 'package.json' and 'package-lock.json' on our local machine
# (in the ./backend folder) and copy them into the '/app' folder.
COPY package*.json ./

# 4. "RUN npm install"
# Inside the container, run 'npm install'. This installs all our
# dependencies (Express, Prisma, etc.) based on the package.json.
RUN npm install

# 5. "COPY prisma ./prisma/"
# Copy our local 'prisma' folder (containing the schema.prisma)
# into the container's '/app' folder, creating '/app/prisma'.
COPY prisma ./prisma/

# 6. "RUN npx prisma generate"
# Run the prisma command to generate the type-safe client that
# our code needs to talk to the database.
RUN npx prisma generate

# 7. "COPY . ."
# Copy EVERYTHING ELSE from our local folder (like our 'src' folder)
# into the '/app' folder.
COPY . .

# 8. "RUN npm run build"
# Run our 'build' script from package.json. This is what
# compiles our TypeScript (.ts files) into JavaScript (.js files).
RUN npm run build

# 9. "EXPOSE 8080"
# Tell Render that our application will be listening for
# traffic on port 8080.
EXPOSE 8080

# 10. "CMD [ "npm", "run", "start" ]"
# This is the final command. When Render starts the container,
# this is the command it will run: 'npm run start'. This, in turn,
# runs 'node dist/index.js' and starts our server.
CMD [ "npm", "run", "start" ]