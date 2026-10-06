"use client";

import type { RTKParticipant } from "@cloudflare/realtimekit-react";
import { ArrowDown, Check, HandPalm, Microphone, MicrophoneSlash, UserMinus, X } from "@phosphor-icons/react";
import { useEffect } from "react";
import { Avatar } from "./avatar";
import type { Meeting } from "./types";

export type HandRequest = { displayName: string; userId: string; peerId: string };

type Props = {
  meeting: Meeting;
  isHost: boolean;
  hostName: string;
  speakers: RTKParticipant[];
  listeners: RTKParticipant[];
  requests: HandRequest[];
  onAllow: (r: HandRequest) => unknown;
  onDeny: (r: HandRequest) => unknown;
  hostPresent: boolean;
  hostSpeaking: boolean;
  onClose: () => void;
};

// Everyone in the room. Phones: bottom sheet. Desktop: right-hand panel.
export function PeopleSheet({
  meeting,
  isHost,
  hostName,
  speakers,
  listeners,
  requests,
  onAllow,
  onDeny,
  hostPresent,
  hostSpeaking,
  onClose,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const perms = meeting.self.permissions;
  const selfOnStage = meeting.stage.status === "ON_STAGE";
  const selfName = meeting.self.name;
  // Host (if connected) + other speakers + other listeners + you (when you are not the host).
  const total = (hostPresent || isHost ? 1 : 0) + speakers.length + listeners.length + (isHost ? 0 : 1);

  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-stretch sm:justify-end" role="dialog" aria-modal aria-label="People">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative flex max-h-[85dvh] w-full flex-col rounded-t-3xl bg-stone-900 text-white ring-1 ring-white/10 sm:max-h-none sm:w-96 sm:rounded-none sm:rounded-l-3xl">
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
        <header className="flex items-center justify-between px-5 pb-3 pt-4">
          <h2 className="text-lg font-semibold">
            People <span className="font-normal text-stone-400">· {total}</span>
          </h2>
          <button onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 hover:bg-white/10">
            <X size={18} weight="bold" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-3 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
          {isHost && requests.length > 0 && (
            <Section title="Raised hands" count={requests.length}>
              {requests.map((r) => (
                <Row key={r.peerId} name={r.displayName} tag={<HandPalm size={16} weight="fill" className="text-amber-400" />}>
                  <IconButton label={`Decline ${r.displayName}`} onClick={() => onDeny(r)}>
                    <X size={16} weight="bold" />
                  </IconButton>
                  <IconButton label={`Let ${r.displayName} speak`} primary onClick={() => onAllow(r)}>
                    <Check size={16} weight="bold" />
                  </IconButton>
                </Row>
              ))}
            </Section>
          )}

          <Section title="Speaking" count={(hostPresent || isHost ? 1 : 0) + speakers.length + (!isHost && selfOnStage ? 1 : 0)}>
            {(hostPresent || isHost) && (
              <Row name={isHost ? `${hostName} (you)` : hostName} avatarName={hostName} speaking={hostSpeaking} tag={<Tag>Host</Tag>}>
                <MicState on={hostSpeaking} />
              </Row>
            )}
            {!isHost && selfOnStage && (
              <Row name={`${selfName} (you)`} avatarName={selfName} speaking={meeting.self.audioEnabled}>
                <MicState on={meeting.self.audioEnabled} />
              </Row>
            )}
            {speakers.map((p) => (
              <Row key={p.id} name={p.name} speaking={p.audioEnabled} tag={guestTag(p)}>
                <MicState on={p.audioEnabled} />
                {isHost && p.audioEnabled && perms.canDisableParticipantAudio && (
                  <IconButton label={`Mute ${p.name}`} onClick={() => p.disableAudio()}>
                    <MicrophoneSlash size={16} weight="bold" />
                  </IconButton>
                )}
                {isHost && (
                  <IconButton label={`Move ${p.name} to listeners`} onClick={() => meeting.stage.kick([p.userId])}>
                    <ArrowDown size={16} weight="bold" />
                  </IconButton>
                )}
              </Row>
            ))}
          </Section>

          <Section title="Listening" count={listeners.length + (!isHost && !selfOnStage ? 1 : 0)}>
            {!isHost && !selfOnStage && <Row name={`${selfName} (you)`} avatarName={selfName} />}
            {listeners.map((p) => (
              <Row key={p.id} name={p.name} tag={guestTag(p)}>
                {isHost && perms.kickParticipant && (
                  <IconButton
                    label={`Remove ${p.name}`}
                    onClick={() => confirm(`Remove ${p.name} from the prayer?`) && p.kick()}
                  >
                    <UserMinus size={16} weight="bold" />
                  </IconButton>
                )}
              </Row>
            ))}
            {listeners.length === 0 && (isHost || selfOnStage) && (
              <p className="px-3 py-4 text-sm text-stone-500">No one listening yet. Share your link to invite people.</p>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

// Guests' ids are minted by us as "guest-<uuid>" (see lib/guest.ts).
const guestTag = (p: RTKParticipant) => (p.customParticipantId?.startsWith("guest-") ? <Tag muted>Guest</Tag> : null);

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="mt-3">
      <h3 className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-stone-500">
        {title} · {count}
      </h3>
      <ul>{children}</ul>
    </section>
  );
}

function Row({
  name,
  avatarName = name,
  speaking,
  tag,
  children,
}: {
  name: string;
  avatarName?: string;
  speaking?: boolean;
  tag?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-white/5">
      <Avatar name={avatarName} size={40} speaking={speaking} />
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate font-medium">{name}</span>
        {tag}
      </span>
      <span className="flex shrink-0 items-center gap-1.5">{children}</span>
    </li>
  );
}

function Tag({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        muted ? "bg-white/10 text-stone-400" : "bg-amber-500/20 text-amber-300"
      }`}
    >
      {children}
    </span>
  );
}

function MicState({ on }: { on: boolean }) {
  return on ? (
    <Microphone size={18} weight="fill" className="text-amber-400" aria-label="Mic on" />
  ) : (
    <MicrophoneSlash size={18} className="text-stone-500" aria-label="Muted" />
  );
}

function IconButton({
  label,
  primary,
  onClick,
  children,
}: {
  label: string;
  primary?: boolean;
  onClick: () => unknown;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => void onClick()}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
        primary ? "bg-white text-stone-900 hover:bg-stone-200" : "bg-white/10 hover:bg-white/20"
      }`}
    >
      {children}
    </button>
  );
}
