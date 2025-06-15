import { z } from "zod";
import * as jwt from "jsonwebtoken";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { env } from "~/env";

export const cameraRouter = createTRPCRouter({
  getJwt: publicProcedure
    .input(z.object({ cameraId: z.number().int() }))
    .mutation(({ input }) => {
      const payload = {
        coaCamera: input.cameraId,
      };

      return jwt.sign(payload, env.JWT_SHARED_SECRET);
    }),
}); 