import Head from "next/head";
import { api } from "~/utils/api";
import type { NextPage } from "next";
import { PageLayout } from "~/components/layout";
import Image from "next/image";
import { LoadingPage } from "~/components/loading";
import { PostView } from "~/components/postview";

const ProfileFeed = (props: {userId: string}) => {

  const {data, isLoading} = api.posts.getPostsByUserId.useQuery({
    userId: props.userId
  });

  if (isLoading) return <LoadingPage />

  if (!data || data.length === 0) return <div>User has not posted</div>;

  return <div className="flex flex-col">
    {data.map((fullPost) => (
      <PostView {...fullPost} key={fullPost.post.id} />
    ))}
  </div>
}

const ProfilePage: NextPage = () => {
  const { data, isLoading } = api.profile.getUserbyUsername.useQuery({
    username: "str1ck0"
  });

  if (isLoading) return <div>Loading...</div>;

  if (!data) return <div>User not found</div>;

  return (
    <>
      <Head>
        <title>Profile</title>
      </Head>
      <PageLayout>
        <div className="h-36 bg-slate-600 relative">
          <Image
            src={data.profilePicture}
            alt={`@${data.username ?? ""}'s profile picture`}
            width={128}
            height={128}

            className="-mb-[64px] absolute bottom-0 left-0 ml-4 
            rounded-full border-4 border-black bg-black"
          />
        </div>
        <div className="h-[64px]"></div>
        <div className="p-4 text-2xl font-bold">
          {`@${data.username}`}
        </div>
        <div className="border-b border-slate-400 w-full"/>
        <ProfileFeed userId={data.id} />
      </PageLayout>
    </>
  );
};

export default ProfilePage;


