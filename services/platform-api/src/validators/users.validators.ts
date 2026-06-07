import { z } from "zod";
import { paginationQuery } from "./pagination.js";

export const listUsersQuery = paginationQuery;
export const listUsersParams = z.object({});

export type ListUsersQuery = z.infer<typeof listUsersQuery>;
export type ListUsersParams = z.infer<typeof listUsersParams>;
