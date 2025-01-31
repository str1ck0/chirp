import type { User } from '@clerk/nextjs/server'
import { createClerkClient } from '@clerk/nextjs/server'
import { TRPCError } from '@trpc/server';
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const filterUserForClient = (user: User) => {
  return {
    id: user.id, 
    name: user.username, 
    profilePicture: user.imageUrl
  }
}

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: publicProcedure
  .input(z.object({ 
    content: z.string().min(1).max(255), // max(255) to match @db.VarChar(255)
    authorId: z.string()
  }))
  .mutation(async ({ ctx, input }) => {
    return ctx.db.post.create({
      data: {
        content: input.content,
        authorId: input.authorId,
      },
    });
  }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    const post = await ctx.db.post.findFirst({
      orderBy: { createdAt: "desc" },
    });

    return post ?? null;
  }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.post.findMany({
      take: 100,
      orderBy: [{ createdAt: "desc" }],
    });

    const userListResponse = await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 100,
    });

    const users = userListResponse.data.map(filterUserForClient);

    console.log(users);

    return posts.map((post) => {
      const author = users.find((user) => user.id === post.authorId);

      if (!author)
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR",
          message: `Author not found for post ${post.id}`
        });

      return {
        post,
        author
      };
    });
  }),
});
