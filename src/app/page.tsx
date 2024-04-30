import { Chat } from "./components/chat";
import { Suspense } from "react";
import RenderStreamData from "./components/RenderStreamData";

export const runtime = "edge";

export default function Page() {
  return (
    <>
      <Suspense fallback={<div>loading...</div>}>
        <Chat />;
      </Suspense>
    </>
  );
}
