FROM node:20-alpine

WORKDIR /app

COPY package.json ./

RUN npm install --no-audit --no-fund --legacy-peer-deps

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
