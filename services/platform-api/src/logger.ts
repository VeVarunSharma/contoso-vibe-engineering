import pino, { type LoggerOptions } from "pino";

const isProduction = process.env.NODE_ENV === "production";

const redactPaths = [
  "password",
  "token",
  "apiKey",
  "authorization",
  "*.password",
  "*.token",
  "*.apiKey",
  "*.authorization",
  "*.*.password",
  "*.*.token",
  "*.*.apiKey",
  "*.*.authorization",
  "req.headers.authorization",
  "req.headers.Authorization",
  "req.headers.cookie",
  "req.body.password",
  "req.body.token",
  "req.body.apiKey",
  "req.query.password",
  "req.query.token",
  "req.query.apiKey",
  "res.headers.authorization",
] as const;

const loggerOptions: LoggerOptions = {
  name: "platform-api",
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [...redactPaths],
    censor: "[Redacted]",
  },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "SYS:standard",
          },
        },
      }),
};

export const logger = pino(loggerOptions);

export default logger;
