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
      // if we hit here we need an unsanitized username so hit api once more
      const { data: users } = (
        await clerkClient.users.getUserList({
          limit: 200,
        })
      );
      const foundUser = users.find((user) => user.externalAccounts.some((account) => account.username === input.username));
      if (!foundUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      return filterUserForClient(foundUser);
    }

    return filterUserForClient(user);
  }),
});
