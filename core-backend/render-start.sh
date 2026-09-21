#!/bin/sh
# Render "dockerCommand" không chạy qua shell thật (exec trực tiếp, tách theo khoảng trắng) nên
# "&&" và dấu ngoặc kép trong render.yaml không hoạt động như trên máy local - dùng script riêng
# này để chạy nhiều bước: build production, áp migration, rồi mới start server thật.
set -e
npm run build
npx prisma migrate deploy
node dist/main
