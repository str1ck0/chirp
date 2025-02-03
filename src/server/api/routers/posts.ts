import { createClerkClient } from '@clerk/nextjs/server'
import { TRPCError } from '@trpc/server';
import { z } from "zod";
import { filterUserForClient } from '~/server/helpers/filterUserForClient';


import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import type { Post } from '@prisma/client';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

const addUserDataToPosts = async (posts: Post[]) => {
  const userListResponse = await clerkClient.users.getUserList({
    userId: posts.map((post) => post.authorId),
    limit: 100,
  });

  const users = userListResponse.data.map(filterUserForClient);

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
};

export const postsRouter = createTRPCRouter({

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.post.findUnique({ 
        where: { id: input.id } 
      });

      if (!post) throw new TRPCError({ code: "NOT_FOUND"});

      return (await addUserDataToPosts([post]))[0];
    }),

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

    return addUserDataToPosts(posts);
  }),

  getPostsByUserId: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(({ ctx, input }) =>
      ctx.db.post
        .findMany({
          where: {
            authorId: input.userId,
          },
          take: 100,
          orderBy: [{ createdAt: "desc" }],
        })
        .then(addUserDataToPosts)
    ),

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
