# Stage 1: Build the React application
# Use a Node image to compile the React code
FROM node:20-alpine as build

# Set working directory inside the container
WORKDIR /app


COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build


FROM nginx:stable-alpine as production-stage


COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Nginx starts automatically by default
# CMD ["nginx", "-g", "daemon off;"]
