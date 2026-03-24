FROM node:22-alpine

WORKDIR /app

COPY . .

RUN npm install

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "index.js"]

CMD ["sh", "-c", "node index.js"]