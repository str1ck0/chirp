import { createClerkClient } from '@clerk/nextjs/server'
import { TRPCError } from '@trpc/server';
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { filterUserForClient } from '~/server/helpers/filterUserForClient';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export const profileRouter = createTRPCRouter({
  getUserbyUsername: publicProcedure
  .input(z.object({ username: z.string() }))
  .query(async ({ input }) => {
    const { data } = await clerkClient.users.getUserList({
      username: [input.username],
    });

    const user = data[0];
    if (!user) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `User with username ${input.username} not found`,
      });
    }

    return filterUserForClient(user);
  }),
});
