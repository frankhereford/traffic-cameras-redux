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
  getAllCameras: publicProcedure.query(({ ctx }) => {
    return ctx.db.camera.findMany({
      include: {
        status: true,
      },
    });
  }),
  getPotentialCameras: publicProcedure.query(({ ctx }) => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return ctx.db.camera.findMany({
      where: {
        OR: [
          // Cameras whose status is not 'unavailable'
          {
            status: {
              name: {
                not: "unavailable",
              },
            },
          },
          // Cameras whose status is 'unavailable' but updated within the last 24 hours
          {
            status: {
              name: "unavailable",
            },
            updatedAt: {
              gte: twentyFourHoursAgo,
            },
          },
        ],
      },
      include: {
        status: true,
      },
    });
  }),
  getWorkingCameras: publicProcedure.query(({ ctx }) => {
    return ctx.db.camera.findMany({
      where: {
        status: {
          name: "200",
        },
      },
      include: {
        status: true,
      },
    });
  }),
}); 