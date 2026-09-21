FROM node:20-alpine

WORKDIR /app

# Prisma engine cần OpenSSL - Alpine không có sẵn, thiếu thư viện này sẽ gây lỗi
# "Could not parse schema engine response" khi chạy migrate/generate trong container.
RUN apk add --no-cache openssl libssl3

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "start:dev"]
