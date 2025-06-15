import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const cameraRouter = createTRPCRouter({
  getJwt: publicProcedure
    .input(z.object({ cameraId: z.number().int() }))
    .mutation(() => {
      return "jwthere";
    }),
}); 