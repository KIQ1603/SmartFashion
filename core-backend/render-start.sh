#!/bin/sh
# Build TypeScript đã bake sẵn vào image lúc dựng (xem Dockerfile.render) - ở đây chỉ còn áp
# migration (cần DATABASE_URL thật của Render, không có lúc build image) rồi start server thật.
set -e
npx prisma migrate deploy
node dist/main
