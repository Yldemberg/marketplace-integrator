FROM node:22-alpine

WORKDIR /app

COPY . .

RUN npm install

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "index.js"]