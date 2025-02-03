import type { User } from '@clerk/nextjs/server'
import { createClerkClient } from '@clerk/nextjs/server'
import { TRPCError } from '@trpc/server';
import { z } from "zod";

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";

const filterUserForClient = (user: User) => {
  return {
    id: user.id, 
    username: user.username, 
    profilePicture: user.imageUrl
  }
}

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export const postsRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
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

      if (!author?.username)
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR",
          message: `Author not found for post ${post.id}`
        });

      return {
        post,
        author: {
          ...author,
          username: author.username,
        }
      };
    });
  }),

  create: privateProcedure
    .input(
      z.object({
        content: z.string().emoji("Only emojis are allowed").min(1).max(280),
      })
    )
    .mutation(async ({ctx, input }) => {
    
    const authorId = ctx.userId

    const post = await ctx.db.post.create({
      data: {
        authorId, 
        content: input.content,
      },
    });

    return post;
  })
});
