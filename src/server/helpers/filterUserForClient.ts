import type { User } from '@clerk/nextjs/server'

export const filterUserForClient = (user: User) => {
  return {
    id: user.id, 
    username: user.username, 
    profilePicture: user.imageUrl,
    externalUsername: user.externalAccounts.find((externalAccount) => externalAccount.provider === "oauth_github")?.username ?? null
  };
}
