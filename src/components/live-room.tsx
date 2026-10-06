"use client";

import { RealtimeKitProvider, useRealtimeKitClient, type RTKParticipant } from "@cloudflare/realtimekit-react";
import { RtkParticipantsAudio } from "@cloudflare/realtimekit-react-ui";
import {
  ArrowDown,
  ArrowLeft,
  Broadcast,
  HandPalm,
  Microphone,
  MicrophoneSlash,
  Monitor,
  Play,
  SignOut,
  Stop,
  Users,
  VideoCamera,
  VideoCameraSlash,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { LiveBadge, Waveform } from "./brand";
import { Avatar, initials } from "./room/avatar";
import { MediaStage, type Feed } from "./room/media-stage";
import { PeopleSheet, type HandRequest } from "./room/people-sheet";
import type { Meeting } from "./room/types";
import { useMeetingUpdates } from "./room/use-meeting-updates";
import { ShareLink } from "./share-link";

export type LiveRoomProps = {
  authToken: string;
  isHost: boolean;
  broadcastId: string;
  title: string;
  hostName: string;
  // users.id of the host; RealtimeKit carries it as each participant's customParticipantId.
  hostId: string;
  startedAt: string;
  endBroadcast: () => Promise<void>;
};

// Audio-only room built on the RealtimeKit core SDK (no video-call UI kit layout).
export default function LiveRoom(props: LiveRoomProps) {
  const [meeting, initMeeting] = useRealtimeKitClient();

  useEffect(() => {
    // Hosts broadcast their microphone; listeners join muted. Audio only, like Mixlr.
    initMeeting({ authToken: props.authToken, defaults: { audio: props.isHost, video: false } });
  }, [props.authToken, props.isHost, initMeeting]);

  return (
    <div className="relative flex min-h-dvh flex-1 flex-col overflow-hidden bg-stone-950 text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 50% at 50% 0%, rgba(217,119,6,0.30), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(120,53,15,0.35), transparent 70%)",
        }}
      />
      <RealtimeKitProvider value={meeting} fallback={<Room {...props} meeting={undefined} />}>
        <Room {...props} meeting={meeting} />
        {/* Plays everyone else's audio. Without it listeners hear nothing. */}
        {meeting && <RtkParticipantsAudio meeting={meeting} />}
      </RealtimeKitProvider>
    </div>
  );
}

function Room({ meeting, ...props }: LiveRoomProps & { meeting: Meeting | undefined }) {
  return meeting ? <ConnectedRoom {...props} meeting={meeting} /> : <Shell {...props} stage={<Status text="Connecting…" />} />;
}

function ConnectedRoom({ meeting, ...props }: LiveRoomProps & { meeting: Meeting }) {
  useMeetingUpdates(meeting);
  const [joining, setJoining] = useState(false);
  const [ending, startEnding] = useTransition();
  const [showPeople, setShowPeople] = useState(false);

  const roomState = meeting.self.roomState;
  const micOn = meeting.self.audioEnabled;
  const micStatus = meeting.self.mediaPermissions?.audio as string | undefined;
  const micDenied = micStatus === "DENIED" || micStatus === "SYS_DENIED";
  const stageStatus = meeting.stage.status;
  const onStage = stageStatus === "ON_STAGE";
  // ALLOWED: may speak any time. CAN_REQUEST: raise a hand first. NOT_ALLOWED: listen only.
  const stageAccess = meeting.self.permissions.stageAccess as string;

  const others = Array.from(meeting.participants.joined.values()) as RTKParticipant[];
  const host = props.isHost ? null : others.find((p) => p.customParticipantId === props.hostId);
  const guests = others.filter((p) => p.customParticipantId !== props.hostId);
  const speakers = guests.filter((p) => p.stageStatus === "ON_STAGE");
  const listeners = guests.filter((p) => p.stageStatus !== "ON_STAGE");
  // Count yourself when you're listening.
  const listenerCount = listeners.length + (!props.isHost && !onStage ? 1 : 0);
  const hostSpeaking = props.isHost ? micOn : Boolean(host?.audioEnabled);
  const [pushedRequests, setPushedRequests] = useState<HandRequest[]>([]);
  useEffect(() => {
    const onUpdate = (list?: HandRequest[]) => setPushedRequests(list ?? []);
    meeting.stage.on("stageAccessRequestUpdate", onUpdate);
    return () => void meeting.stage.off("stageAccessRequestUpdate", onUpdate);
  }, [meeting]);
  const requests: HandRequest[] = props.isHost
    ? [
        ...guests
          .filter((p) => p.stageStatus === "REQUESTED_TO_JOIN_STAGE")
          .map((p) => ({ displayName: p.name, userId: p.userId, peerId: p.id })),
        ...pushedRequests,
      ].filter((r, i, all) => all.findIndex((x) => x.userId === r.userId) === i)
    : [];

  // Show failures instead of silently doing nothing.
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(id);
  }, [notice]);
  async function attempt(action: () => unknown, failure: string) {
    try {
      await action();
    } catch (err) {
      console.error(failure, err);
      setNotice(`${failure}${err instanceof Error && err.message ? `: ${err.message}` : ""}`);
    }
  }

  async function join() {
    setJoining(true);
    try {
      await meeting.join();
      // Webinar presets put presenters on stage; make sure, so listeners can hear.
      if (props.isHost && meeting.stage.status !== "ON_STAGE") await meeting.stage.join().catch(() => {});
    } finally {
      setJoining(false);
    }
  }

  // Listener accepted (or allowed) to speak: step on stage, then turn the mic on.
  const startSpeaking = () =>
    attempt(async () => {
      await meeting.stage.join();
      await meeting.self.enableAudio();
    }, "Couldn’t turn on your mic");

  const stopSpeaking = () =>
    attempt(async () => {
      await meeting.self.disableAudio().catch(() => {});
      if (meeting.self.videoEnabled) await meeting.self.disableVideo().catch(() => {});
      if (meeting.self.screenShareEnabled) await meeting.self.disableScreenShare().catch(() => {});
      await meeting.stage.leave();
    }, "Couldn’t move you back to listening");

  const allow = (r: HandRequest) => attempt(() => meeting.stage.grantAccess([r.userId]), `Couldn’t let ${r.displayName} speak`);
  const deny = (r: HandRequest) => attempt(() => meeting.stage.denyAccess([r.userId]), "Couldn’t decline the request");

  function end() {
    if (!confirm("End the broadcast for everyone?")) return;
    startEnding(async () => {
      // Remove listeners from the room so they see "ended" right away; ignore if the preset can't.
      await meeting.participants.kickAll().catch(() => {});
      await props.endBroadcast();
    });
  }

  if (roomState === "ended" || roomState === "kicked") {
    return <Shell {...props} stage={<Ended />} hideShare />;
  }
  if (roomState === "left") {
    return (
      <Shell
        {...props}
        hideShare
        stage={
          <Status text="You left the prayer">
            <button onClick={join} className="mt-6 h-12 rounded-full bg-white px-8 font-semibold text-stone-900">
              Rejoin
            </button>
          </Status>
        }
      />
    );
  }

  if (roomState !== "joined") {
    return (
      <Shell
        {...props}
        stage={
          <div className="flex flex-col items-center gap-8 text-center">
            <HostAvatar name={props.hostName} speaking={false} />
            <div className="flex flex-col gap-2">
              <h1 className="font-display text-3xl leading-tight text-balance sm:text-4xl">{props.title}</h1>
              <p className="text-stone-400">Led by {props.hostName}</p>
            </div>
          </div>
        }
        controls={
          <div className="flex w-full flex-col items-center gap-3">
            <button
              onClick={join}
              disabled={joining}
              className={`flex h-16 w-full max-w-sm items-center justify-center gap-3 rounded-full text-lg font-semibold shadow-xl transition active:scale-[0.99] disabled:opacity-60 ${
                props.isHost ? "bg-red-600 shadow-red-950/50 hover:bg-red-500" : "bg-white text-stone-900 hover:bg-stone-200"
              }`}
            >
              {joining ? (
                "Joining…"
              ) : props.isHost ? (
                <>
                  <Broadcast size={24} weight="bold" /> Start broadcasting
                </>
              ) : (
                <>
                  <Play size={22} weight="fill" /> Tap to listen
                </>
              )}
            </button>
            <p className="text-xs text-stone-500">
              {props.isHost ? "Your listeners will hear your microphone." : "Turn your volume up."}
            </p>
          </div>
        }
      />
    );
  }

  const peopleButton = (
    <button
      onClick={() => setShowPeople(true)}
      aria-label="People"
      className="relative flex h-10 items-center gap-1.5 rounded-full bg-white/5 px-3 text-sm font-semibold hover:bg-white/10"
    >
      <Users size={18} weight="bold" />
      {1 + speakers.length + listenerCount}
      {requests.length > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-stone-950">
          {requests.length}
        </span>
      )}
    </button>
  );

  // Everyone on stage (host + approved speakers) can share camera and screen, host first.
  const onAir = props.isHost || onStage;
  const videoOn = meeting.self.videoEnabled;
  const screenOn = meeting.self.screenShareEnabled;
  const feeds: Feed[] = [];
  const addFeeds = (id: string, name: string, self: boolean, p: Sharer | null | undefined) => {
    if (!p) return;
    if (p.screenShareEnabled) {
      feeds.push({ key: `${id}-screen`, name, kind: "screen", track: p.screenShareTracks?.video, micOn: p.audioEnabled, self });
    }
    if (p.videoEnabled) feeds.push({ key: `${id}-cam`, name, kind: "camera", track: p.videoTrack, micOn: p.audioEnabled, self });
  };
  if (props.isHost) addFeeds("self", props.hostName, true, meeting.self);
  else addFeeds("host", props.hostName, false, host);
  if (!props.isHost && onStage) addFeeds("self", meeting.self.name, true, meeting.self);
  for (const p of speakers) addFeeds(p.id, p.name, false, p);

  const toggleCamera = () =>
    attempt(() => (videoOn ? meeting.self.disableVideo() : meeting.self.enableVideo()), "Couldn’t turn on your camera");

  async function toggleScreen() {
    try {
      await (screenOn ? meeting.self.disableScreenShare() : meeting.self.enableScreenShare());
    } catch (err) {
      // Closing the browser's "choose what to share" picker isn't an error worth showing.
      if (err instanceof Error && /denied|cancel|NotAllowed/i.test(`${err.name} ${err.message}`)) return;
      console.error(err);
      setNotice("Couldn’t share your screen");
    }
  }

  const mediaButtons = (
    <div className="flex items-center gap-3">
      <ToggleButton on={videoOn} label={videoOn ? "Turn camera off" : "Turn camera on"} onClick={toggleCamera}>
        {videoOn ? <VideoCamera size={22} weight="fill" /> : <VideoCameraSlash size={22} />}
      </ToggleButton>
      {canShareScreen && (
        <ToggleButton on={screenOn} label={screenOn ? "Stop sharing screen" : "Share screen"} onClick={toggleScreen}>
          <Monitor size={22} weight={screenOn ? "fill" : "regular"} />
        </ToggleButton>
      )}
    </div>
  );

  const micButton = (
    <button
      onClick={() => (micOn ? meeting.self.disableAudio() : meeting.self.enableAudio())}
      aria-pressed={micOn}
      className={`flex h-20 w-20 flex-col items-center justify-center rounded-full text-xs font-semibold shadow-xl transition active:scale-95 ${
        micOn ? "bg-white text-stone-900" : "bg-red-600 text-white"
      }`}
    >
      {micOn ? <Microphone size={28} weight="fill" /> : <MicrophoneSlash size={28} weight="fill" />}
      {micOn ? "Mute" : "Unmute"}
    </button>
  );

  return (
    <>
      <Shell
        {...props}
        topRight={peopleButton}
        stage={
          <div className={`flex w-full flex-col items-center text-center ${feeds.length > 0 ? "gap-5" : "gap-8"}`}>
            {feeds.length > 0 ? <MediaStage feeds={feeds} /> : <HostAvatar name={props.hostName} speaking={hostSpeaking} />}
            <div className="flex flex-col gap-2">
              <h1
                className={`font-display leading-tight text-balance ${feeds.length > 0 ? "text-2xl" : "text-3xl sm:text-4xl"}`}
              >
                {props.title}
              </h1>
              <p className="text-stone-400">
                {props.isHost
                  ? micOn
                    ? "You’re on air"
                    : "You’re muted"
                  : host
                    ? host.audioEnabled
                      ? `${props.hostName} is speaking`
                      : `${props.hostName} is muted`
                    : `Waiting for ${props.hostName} to connect…`}
              </p>
            </div>
            {micDenied && (props.isHost || onStage) && (
              <p className="max-w-xs rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">
                Microphone access is blocked. Allow it in your browser’s site settings, then reload.
              </p>
            )}
            {(speakers.length > 0 || (!props.isHost && onStage)) && (
              <div className="flex flex-wrap justify-center gap-4">
                {!props.isHost && onStage && <Speaker name={meeting.self.name} you on={micOn} />}
                {speakers.map((p) => (
                  <Speaker key={p.id} name={p.name} on={p.audioEnabled} />
                ))}
              </div>
            )}
            <button onClick={() => setShowPeople(true)}>
              <Listeners people={listeners} count={listenerCount} selfName={props.isHost || onStage ? null : meeting.self.name} />
            </button>
          </div>
        }
        controls={
          <div className="flex w-full max-w-sm flex-col gap-4">
            {notice && (
              <p role="alert" className="rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-red-200 ring-1 ring-red-400/30">
                {notice}
              </p>
            )}
            {props.isHost && requests.length > 0 && (
              <HandBanner
                request={requests[0]!}
                more={requests.length - 1}
                onAllow={() => allow(requests[0]!)}
                onDeny={() => deny(requests[0]!)}
                onMore={() => setShowPeople(true)}
              />
            )}
            {!props.isHost && stageStatus === "ACCEPTED_TO_JOIN_STAGE" && (
              <div className="flex items-center gap-3 rounded-2xl bg-amber-500/15 p-3 pl-4 ring-1 ring-amber-400/30">
                <HandPalm size={22} weight="fill" className="shrink-0 text-amber-400" />
                <p className="flex-1 text-sm">{props.hostName} invited you to speak</p>
                <button
                  onClick={() => attempt(() => meeting.stage.leave(), "Couldn’t decline")}
                  className="h-9 rounded-full px-3 text-sm text-stone-300 hover:bg-white/10"
                >
                  Not now
                </button>
                <button onClick={startSpeaking} className="h-9 rounded-full bg-white px-4 text-sm font-semibold text-stone-900">
                  Speak
                </button>
              </div>
            )}

            {onAir ? (
              <div className="flex items-center justify-between gap-3">
                {mediaButtons}
                {micButton}
                <div className="flex items-center gap-3">
                  <ShareLink path={`/live/${props.broadcastId}`} title={props.title} className={iconButton} compact />
                  {props.isHost ? (
                    <button
                      onClick={end}
                      disabled={ending}
                      aria-label="End broadcast"
                      title="End broadcast"
                      className={`${iconButton} border-red-500/40 bg-red-600/20 text-red-300`}
                    >
                      <Stop size={20} weight="fill" />
                    </button>
                  ) : (
                    <button onClick={stopSpeaking} aria-label="Back to listening" title="Back to listening" className={iconButton}>
                      <ArrowDown size={20} weight="bold" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <ShareLink path={`/live/${props.broadcastId}`} title={props.title} className={roundButton} compact />
                {stageAccess === "NOT_ALLOWED" ? (
                  <Waveform bars={14} className="h-8 flex-1 gap-1" barClassName="w-1 flex-1 bg-amber-400/80" />
                ) : (
                  <HandButton
                    status={stageStatus}
                    direct={stageAccess === "ALLOWED"}
                    onRaise={() =>
                      stageAccess === "ALLOWED"
                        ? startSpeaking()
                        : attempt(() => meeting.stage.requestAccess(), "Couldn’t raise your hand")
                    }
                    onLower={() => attempt(() => meeting.stage.cancelRequestAccess(), "Couldn’t lower your hand")}
                  />
                )}
                <button onClick={() => meeting.leave()} className={`${roundButton} gap-2`}>
                  <SignOut size={18} weight="bold" />
                  Leave
                </button>
              </div>
            )}
          </div>
        }
      />
      {showPeople && (
        <PeopleSheet
          meeting={meeting}
          isHost={props.isHost}
          hostName={props.hostName}
          speakers={speakers}
          listeners={listeners}
          requests={requests}
          onAllow={allow}
          onDeny={deny}
          hostPresent={Boolean(host)}
          hostSpeaking={hostSpeaking}
          onClose={() => setShowPeople(false)}
        />
      )}
    </>
  );
}

function HandButton({
  status,
  direct,
  onRaise,
  onLower,
}: {
  status: string;
  direct: boolean;
  onRaise: () => unknown;
  onLower: () => unknown;
}) {
  const raised = status === "REQUESTED_TO_JOIN_STAGE";
  return (
    <button
      onClick={() => void (raised ? onLower() : onRaise())}
      aria-pressed={raised}
      className={`flex h-20 w-20 flex-col items-center justify-center gap-0.5 rounded-full text-xs font-semibold shadow-xl transition active:scale-95 ${
        raised ? "bg-amber-400 text-stone-950" : "bg-white text-stone-900"
      }`}
    >
      {direct ? <Microphone size={28} weight="fill" /> : <HandPalm size={28} weight="fill" />}
      {direct ? "Speak" : raised ? "Lower" : "Raise"}
    </button>
  );
}

function HandBanner({
  request,
  more,
  onAllow,
  onDeny,
  onMore,
}: {
  request: HandRequest;
  more: number;
  onAllow: () => unknown;
  onDeny: () => unknown;
  onMore: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-2.5 pl-3 ring-1 ring-white/15 backdrop-blur">
      <Avatar name={request.displayName} size={36} />
      <button onClick={onMore} className="min-w-0 flex-1 text-left">
        <p className="flex items-center gap-1.5 truncate text-sm font-medium">
          <HandPalm size={16} weight="fill" className="shrink-0 text-amber-400" />
          {request.displayName}
        </p>
        <p className="text-xs text-stone-400">{more > 0 ? `wants to speak · +${more} more` : "wants to speak"}</p>
      </button>
      <button onClick={() => void onDeny()} aria-label="Decline" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
        <X size={16} weight="bold" />
      </button>
      <button onClick={() => void onAllow()} className="h-9 rounded-full bg-white px-4 text-sm font-semibold text-stone-900">
        Allow
      </button>
    </div>
  );
}

function Speaker({ name, on, you }: { name: string; on: boolean; you?: boolean }) {
  return (
    <div className="flex w-20 flex-col items-center gap-1.5">
      <div className="relative">
        <Avatar name={name} size={56} speaking={on} />
        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 ring-2 ring-stone-950">
          {on ? <Microphone size={13} weight="fill" className="text-amber-400" /> : <MicrophoneSlash size={13} className="text-stone-400" />}
        </span>
      </div>
      <span className="w-full truncate text-xs text-stone-300">{you ? "You" : name.split(/\s+/)[0]}</span>
    </div>
  );
}

// Anything with camera, mic and screen state that can feed the video stage.
type Sharer = Pick<
  RTKParticipant,
  "videoEnabled" | "videoTrack" | "screenShareEnabled" | "screenShareTracks" | "audioEnabled"
>;

// Phone browsers can't share their screen, so only offer it where the API exists.
const canShareScreen = typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getDisplayMedia === "function";

const iconButton =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur transition hover:bg-white/10 disabled:opacity-60";

function ToggleButton({
  on,
  label,
  onClick,
  children,
}: {
  on: boolean;
  label: string;
  onClick: () => unknown;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={`${iconButton} ${on ? "border-white bg-white text-stone-900 hover:bg-stone-200" : ""}`}
    >
      {children}
    </button>
  );
}

const roundButton =
  "flex h-14 min-w-14 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 text-sm font-semibold backdrop-blur transition hover:bg-white/10 disabled:opacity-60";

// Page frame shared by every state: top bar, centered stage, bottom controls.
function Shell({
  stage,
  controls,
  hideShare,
  startedAt,
  topRight,
}: Pick<LiveRoomProps, "startedAt"> & {
  stage: React.ReactNode;
  controls?: React.ReactNode;
  hideShare?: boolean;
  topRight?: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-[max(env(safe-area-inset-top),1rem)]">
      <header className="flex h-12 items-center justify-between">
        <Link
          href="/"
          aria-label="Home"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10"
        >
          <ArrowLeft size={20} weight="bold" />
        </Link>
        {!hideShare && (
          <div className="flex items-center gap-2">
            <LiveBadge />
            <Elapsed since={startedAt} />
          </div>
        )}
        {topRight ?? <span className="w-10" />}
      </header>
      <main className="flex flex-1 flex-col items-center justify-center py-10">{stage}</main>
      {controls && <footer className="flex justify-center">{controls}</footer>}
    </div>
  );
}

function Elapsed({ since }: { since: string }) {
  const start = new Date(since.replace(" ", "T") + "Z").getTime();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const total = Math.max(0, Math.floor((now - start) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="font-mono text-sm tabular-nums text-stone-300">{h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`}</span>
  );
}

function HostAvatar({ name, speaking }: { name: string; speaking: boolean }) {
  return (
    <div className="relative flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
      {speaking && (
        <>
          <span className="absolute inset-0 animate-ping rounded-full bg-amber-500/20 [animation-duration:2s]" />
          <span className="absolute -inset-3 rounded-full border border-amber-400/30" />
        </>
      )}
      <span
        className={`relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-800 font-display text-5xl ring-4 transition sm:text-6xl ${
          speaking ? "ring-amber-400" : "ring-white/10"
        }`}
      >
        {initials(name)}
      </span>
    </div>
  );
}

function Listeners({ people, count, selfName }: { people: RTKParticipant[]; count: number; selfName: string | null }) {
  const names = [...(selfName ? [selfName] : []), ...people.map((p) => p.name)].slice(0, 5);
  return (
    <div className="flex items-center gap-3 rounded-full bg-white/5 py-2 pl-2 pr-4 ring-1 ring-white/10">
      {names.length > 0 && (
        <div className="flex -space-x-2">
          {names.map((name, i) => (
            <Avatar key={`${name}-${i}`} name={name} size={32} className="border-2 border-stone-950" />
          ))}
        </div>
      )}
      <span className="text-sm text-stone-300">
        {count === 0 ? "No one listening yet" : `${count} listening`}
      </span>
    </div>
  );
}

function Status({ text, children }: { text: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center">
      <Waveform bars={12} className="h-10 gap-1.5" barClassName="w-1.5 bg-amber-400/80" />
      <p className="mt-6 text-lg text-stone-300">{text}</p>
      {children}
    </div>
  );
}

function Ended() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <h1 className="font-display text-3xl">This prayer has ended</h1>
      <p className="text-stone-400">Thank you for joining.</p>
      <Link href="/" className="mt-4 flex h-12 items-center rounded-full bg-white px-8 font-semibold text-stone-900">
        Back home
      </Link>
    </div>
  );
}
