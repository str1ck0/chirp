import type { PropsWithChildren } from "react";

export const PageLayout = (props: PropsWithChildren) => {
  return (
    <main className="overflow-none flex h-screen justify-center">
      <div className="flex  flex-col h-full w-full border-x border-slate-400 md:max-w-2xl">
        {props.children}
      </div>
    </main>
  );
};