FROM node:18-alpine AS builder

# Create app directory
WORKDIR /opt/jot-server

COPY . .

RUN npm ci --omit=dev


# ---------- Runtime stage ----------

FROM node:18-alpine

WORKDIR /opt/jot-server

ENV NODE_ENV=production

# Bundle app source
COPY --from=builder /opt/jot-server/node_modules .
COPY --from=builder /opt/jot-server/package.json .
COPY --from=builder /opt/jot-server/app.js .
COPY --from=builder /opt/jot-server/config .
COPY --from=builder /opt/jot-server/modules .

USER node

EXPOSE 5000

CMD [ "node", "app.js" ]
