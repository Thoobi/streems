import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { endCall } from "@/app/actions";
import { LiveRoomLoader } from "@/components/live-room-loader";
import { HOST_PARTICIPANT_ID } from "@/components/room/types";
import { getCall } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createParticipantToken } from "@/lib/realtimekit";

// The host shares /c/<code>; anyone who opens it can join, no account needed.
export default async function CallPage({ params }: PageProps<"/c/[code]">) {
  const { code } = await params;
  const call = await getCall(code);
  if (!call) notFound();
  if (call.code !== code) redirect(`/c/${call.code}`);

  if (call.status === "ended") {
    return <Notice title="This prayer has ended" body={`${call.title}, led by ${call.host_name}. Thank you for joining.`} />;
  }

  // The host is the account that started the call. Everyone else needs no account:
  // they type a name before joining (set in the browser), "Guest" until then.
  const user = await getCurrentUser();
  const isHost = user?.id === call.host_id;
  const participant = isHost
    ? { id: HOST_PARTICIPANT_ID, name: call.host_name, role: "host" as const }
    : { id: `guest-${crypto.randomUUID()}`, name: "Guest", role: "listener" as const };

  let authToken: string;
  try {
    authToken = await createParticipantToken(call.meeting_id, participant);
  } catch (err) {
    console.error(err);
    return (
      <Notice title="Couldn’t connect to the live audio" body="Something went wrong on our side. Please try again in a moment." />
    );
  }

  return (
    <LiveRoomLoader
      authToken={authToken}
      isHost={isHost}
      code={call.code}
      title={call.title}
      hostName={call.host_name}
      startedAt={call.started_at}
      endCall={endCall.bind(null, call.code)}
    />
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-3 bg-stone-950 px-5 text-center text-white">
      <h1 className="font-display text-3xl text-balance">{title}</h1>
      <p className="max-w-sm break-words text-stone-400">{body}</p>
      <Link href="/" className="mt-4 flex h-12 items-center rounded-full bg-white px-8 font-semibold text-stone-900">
        Back home
      </Link>
    </main>
  );
}
