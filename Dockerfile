# Multi-stage: Vite build with baked VITE_* → nginx on Cloud Run port 8080
FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_LIVESTOCK_API_URL
ARG VITE_API_URL
ARG VITE_SAIGE_API_URL
ARG VITE_CONTACT_EMAIL

ENV VITE_LIVESTOCK_API_URL=$VITE_LIVESTOCK_API_URL \
    VITE_API_URL=$VITE_API_URL \
    VITE_SAIGE_API_URL=$VITE_SAIGE_API_URL \
    VITE_CONTACT_EMAIL=$VITE_CONTACT_EMAIL

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
