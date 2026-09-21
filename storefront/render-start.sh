#!/bin/sh
# Xem giải thích trong core-backend/render-start.sh - Render "dockerCommand" không chạy qua shell
# thật nên không dùng được "&&" trực tiếp trong render.yaml, phải tách ra file script riêng.
set -e
npm run build
npm run start
