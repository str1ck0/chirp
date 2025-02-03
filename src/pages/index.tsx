import { SignInButton, useUser } from "@clerk/nextjs";
import Head from "next/head";

import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import { LoadingPage } from "~/components/loading";
import { useState } from "react";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const {user} = useUser();

  const [input, setInput] = useState("");

  const ctx = api.useContext();

  const { mutate, isPending } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.posts.getAll.invalidate();
    }
  });

  console.log(user);

  if (!user) return null;

  return (
    <div className="flex gap-3 w-full">
      <Image 
        src={user.imageUrl} 
        alt="Profile Image" 
        className="w-14 h-14 rounded-full" 
        width={56}
        height={56}
      />
      <input 
        placeholder="Type some emojis" 
        className="bg-transparent grow outline-none"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button 
        onClick={() => { mutate({ content: input })}}
        disabled={isPending}
      >
        {isPending ? "Posting..." : "Post"}
      </button>
    </div>
  )
}

// trpc api to define the shape of the data - element from this array type
type PostWithUser = RouterOutputs["posts"]["getAll"][number]

const PostView = (props: PostWithUser) => {
  const {post, author} = props;
  return (
    <div key={post.id} className="p-4 gap-3 border-b border-slate-400 flex">
      <Image 
        src={author.profilePicture} 
        alt={`@${author.username}'s profile image`} 
        className="w-14 h-14 rounded-full"
        width={56}
        height={56}
      />
      <div className="flex flex-col">
        <div className="flex text-slate-300 gap-1">
          <span>{`@${author.username}`}</span>
          <span>{`• ${dayjs(post.createdAt).fromNow()}`}</span>
        </div>
        <span className="text-xl">{post.content}</span>
      </div>
    </div>
  );
}

const Feed = () => {
  const {data, isLoading: postsLoading } = api.posts.getAll.useQuery();

  if (postsLoading ) return <LoadingPage />;

  if (!data) return <div>No posts found</div>;

  return (  
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

export default function Home() {
  // const hello = api.posts.hello.useQuery({ text: "from tRPC" });

  const {isLoaded: userLoaded, isSignedIn } = useUser();

  // Start fetching asap
  api.posts.getAll.useQuery();


  // Return empty div if user isn't loaded yet
  if (!userLoaded) return <div/>;

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex justify-center h-screen">
        <div className="w-full md:max-w-2xl border-x border-slate-400">
          <div className="border-b border-slate-400 p-4 flex">
            {!isSignedIn && (
              <div className="flex justify-center">
                <SignInButton />
              </div>
            )}
            {isSignedIn && <CreatePostWizard />}
          </div>
          <Feed />
        </div>
      </main>
    </>
  );
}
