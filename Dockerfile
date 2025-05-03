FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .    

EXPOSE 8080
ENV PORT=8080

CMD ["node", "server.js"]
