FROM node:20-alpine
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY package.json pnpm-workspace.yaml turbo.json tsconfig.json .eslintrc.cjs .prettierrc ./ 
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @thai-escrow/web build

EXPOSE 3000

CMD ["pnpm", "--filter", "@thai-escrow/web", "start"]
