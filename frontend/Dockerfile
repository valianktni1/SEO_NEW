### Stage 1 — build the React app ###
FROM node:20-alpine AS build

WORKDIR /app

# Install deps first (better cache)
COPY package.json yarn.lock* ./
RUN yarn install --network-timeout 600000

# Copy the rest of the frontend source
COPY . ./

# Backend URL is baked in at build time. Leave empty so the
# browser uses relative /api/* and nginx (next stage) proxies it.
ARG REACT_APP_BACKEND_URL=
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

RUN yarn build


### Stage 2 — serve with nginx + proxy /api ###
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
