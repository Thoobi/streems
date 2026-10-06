import Link from "next/link";
import { notFound } from "next/navigation";
import { endBroadcast } from "@/app/broadcast-actions";
import { GuestJoinForm } from "@/components/guest-join-form";
import { LiveRoomLoader } from "@/components/live-room-loader";
import { getCurrentUser } from "@/lib/auth";
import { getDb, type Broadcast } from "@/lib/db";
import { getGuest } from "@/lib/guest";
import { createParticipantToken } from "@/lib/realtimekit";

export default async function LivePage({ params }: PageProps<"/live/[id]">) {
  const { id } = await params;
  const db = await getDb();
  const broadcast = await db
    .prepare("SELECT b.*, u.name AS host_name FROM broadcasts b JOIN users u ON u.id = b.host_id WHERE b.id = ?")
    .bind(id)
    .first<Broadcast & { host_name: string }>();
  if (!broadcast) notFound();

  if (broadcast.status === "ended") {
    return (
      <Notice title="This prayer has ended" body={`${broadcast.title}, led by ${broadcast.host_name}. Thank you for joining.`} />
    );
  }

  // The person who started the broadcast hosts it. Other signed-in users listen as
  // themselves; everyone else listens as a named guest.
  const user = await getCurrentUser();
  const guest = user ? null : await getGuest();
  if (!user && !guest) {
    return <GuestJoinForm broadcastId={broadcast.id} title={broadcast.title} hostName={broadcast.host_name} />;
  }
  const isHost = user?.id === broadcast.host_id;
  const participant = { ...(user ?? guest!), role: isHost ? ("host" as const) : ("listener" as const) };

  let authToken: string;
  try {
    authToken = await createParticipantToken(broadcast.meeting_id, participant);
  } catch (err) {
    console.error(err);
    // Details stay in the server logs; listeners just need to know to retry.
    return (
      <Notice
        title="Couldn’t connect to the live audio"
        body="Something went wrong on our side. Please try again in a moment."
      />
    );
  }

  return (
    <LiveRoomLoader
      authToken={authToken}
      isHost={isHost}
      broadcastId={broadcast.id}
      title={broadcast.title}
      hostName={broadcast.host_name}
      hostId={broadcast.host_id}
      startedAt={broadcast.started_at}
      endBroadcast={endBroadcast.bind(null, broadcast.id)}
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
