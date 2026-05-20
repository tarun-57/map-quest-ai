# Frontend Dockerfile (multi-stage)
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
ARG REACT_APP_API_BASE_URL
ARG REACT_APP_GCP_API_KEY
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV REACT_APP_GCP_API_KEY=$REACT_APP_GCP_API_KEY
# Smaller client bundle; set to true only when debugging production builds
ENV GENERATE_SOURCEMAP=false
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


