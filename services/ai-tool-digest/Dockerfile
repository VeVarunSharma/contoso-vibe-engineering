# Azure Functions Node.js custom container
FROM mcr.microsoft.com/azure-functions/node:4-node20

WORKDIR /home/site/wwwroot

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

RUN if [ -f package-lock.json ]; then npm ci --production --ignore-scripts; \
    elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install --prod --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn install --production --frozen-lockfile; \
    else npm install --production --ignore-scripts; fi

COPY . .

RUN npm install --global typescript && npm run build

CMD ["npm", "run", "start:watch"]
