import { Router, type Router as RouterType } from "express";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { logger } from "../logger.js";
import { requireBearerToken } from "../middleware/auth.js";
import { validate, type ValidatedRequest } from "../middleware/validate.js";
import {
  listUsersParams,
  listUsersQuery,
  type ListUsersQuery,
} from "../validators/users.validators.js";

type UserRecord = typeof users.$inferSelect;

type UsersDatabase = {
  query: {
    users: {
      findMany: (options: {
        limit: ListUsersQuery["limit"];
        offset: ListUsersQuery["offset"];
      }) => Promise<UserRecord[]>;
    };
  };
};

type ListUsersRequest = ValidatedRequest<
  undefined,
  typeof listUsersQuery,
  typeof listUsersParams
>;

export const createUsersRouter = (database: UsersDatabase = db): RouterType => {
  const router: RouterType = Router();

  router.use(requireBearerToken);

  router.get(
    "/",
    validate({ query: listUsersQuery, params: listUsersParams }),
    async (req, res) => {
      try {
        const parsedReq = req as unknown as ListUsersRequest;
        const { limit, offset } = parsedReq.query;
        const allUsers = await database.query.users.findMany({ limit, offset });
        res.json(allUsers);
      } catch (error) {
        (req.log ?? logger).error({ err: error }, "Failed to list users");
        res.status(500).json({ error: "Internal Server Error" });
      }
    },
  );

  return router;
};

const router: RouterType = createUsersRouter();

export default router;
