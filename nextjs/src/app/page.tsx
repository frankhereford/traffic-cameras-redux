import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import TrafficCameraApplication from "./_components/TrafficCameraApplication";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <TrafficCameraApplication />
      </main>
    </HydrateClient>
  );
}
