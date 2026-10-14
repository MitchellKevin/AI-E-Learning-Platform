"use client";

import { useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";
import { Captions, CaptionsOff, Check, ChevronDown, Pause, Play, RotateCcw } from "lucide-react";
import type { TranscriptCue } from "@/lib/types";
import styles from "./video-player.module.scss";

const TICK_MS = 200;
const SPEEDS = [1, 1.25, 1.5, 2];
const REQUIRED = 0.9;

function formatTime(seconds: number) {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function formatSpeed(speed: number) {
  return `${String(speed).replace(".", ",")}×`;
}

// Nagebootste videospeler: er is nog geen echte media, dus een timer schuift de afspeelpositie op.
// Later komt hier een <video> uit Storyblok/Mux; de bediening en de 90%-regel blijven hetzelfde.
export function VideoPlayer({
  title,
  duration,
  posterColor,
  transcript,
  done,
  active = true,
  onWatched,
}: {
  title: string;
  duration: number;
  posterColor?: string;
  transcript: TranscriptCue[];
  /** Taak al afgerond: de video telt als bekeken. */
  done: boolean;
  /** Pauzeert zodra de taak dichtklapt. */
  active?: boolean;
  onWatched: () => void;
}) {
  const id = useId();
  const seconds = Math.max(1, Math.ceil(duration));
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [captions, setCaptions] = useState(true);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [watchedCount, setWatchedCount] = useState(done ? seconds : 0);

  const timeRef = useRef(0);
  // Per seconde bijhouden of die echt is afgespeeld; vooruitspoelen telt niet mee.
  const watched = useRef<boolean[]>(Array(seconds).fill(done));
  const reported = useRef(done);

  const progress = watchedCount / seconds;
  const complete = done || progress >= REQUIRED;
  const ended = time >= duration;
  const cueIndex = transcript.findLastIndex((c) => c.start <= time);
  const cue = transcript[cueIndex];

  function seek(to: number) {
    const next = Math.min(duration, Math.max(0, to));
    timeRef.current = next;
    setTime(next);
  }

  function toggle() {
    if (playing) return setPlaying(false);
    if (ended) seek(0);
    setPlaying(true);
  }

  useEffect(() => {
    if (!playing) return;
    const interval = window.setInterval(() => {
      const prev = timeRef.current;
      const next = Math.min(duration, prev + (TICK_MS / 1000) * speed);
      for (let s = Math.floor(prev); s < Math.min(seconds, Math.ceil(next)); s++) watched.current[s] = true;
      timeRef.current = next;
      setTime(next);
      setWatchedCount(watched.current.filter(Boolean).length);
      if (next >= duration) setPlaying(false);
    }, TICK_MS);
    return () => window.clearInterval(interval);
  }, [playing, speed, duration, seconds]);

  // Dichtgeklapte taak: niet onzichtbaar doorspelen.
  useEffect(() => {
    if (!active) setPlaying(false);
  }, [active]);

  useEffect(() => {
    if (complete && !reported.current) {
      reported.current = true;
      onWatched();
    }
  }, [complete, onWatched]);

  function onKeyDown(e: React.KeyboardEvent) {
    const onRange = (e.target as HTMLElement).getAttribute("type") === "range";
    const key = e.key.toLowerCase();
    if (key === "k") toggle();
    else if (key === "j" || (key === "arrowleft" && !onRange)) seek(timeRef.current - 5);
    else if (key === "l" || (key === "arrowright" && !onRange)) seek(timeRef.current + 5);
    else if (key === "c") setCaptions((c) => !c);
    else return;
    e.preventDefault();
  }

  const playLabel = playing ? "Pauzeren" : ended ? "Opnieuw afspelen" : time > 0 ? "Verder afspelen" : "Afspelen";
  const PlayIcon = playing ? Pause : ended ? RotateCcw : Play;
  const transcriptId = `${id}-transcript`;
  const hintId = `${id}-hint`;

  return (
    <div className={styles.player}>
      <div
        role="group"
        aria-label={`Video: ${title}`}
        aria-describedby={hintId}
        className={clsx(styles.frame, playing && styles.playing)}
        style={posterColor ? ({ "--poster": posterColor } as React.CSSProperties) : undefined}
        onKeyDown={onKeyDown}
      >
        {/* Klikvlak voor de muis; de bediening hieronder is de toegankelijke variant. */}
        <button type="button" className={styles.screen} onClick={toggle} tabIndex={-1} aria-hidden>
          <span className={styles.screenHead}>
            <span className={styles.brand}>AI Academy</span>
            <span className={styles.screenTitle}>{title}</span>
          </span>

          <span className={styles.wave} aria-hidden>
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} />
            ))}
          </span>

          {!playing && (
            <span className={styles.bigPlay}>
              <PlayIcon />
            </span>
          )}

          {captions && cue && time > 0 && (
            <span key={cueIndex} className={styles.caption}>
              {cue.text}
            </span>
          )}
        </button>

        <div className={styles.controls}>
          <input
            type="range"
            className={styles.scrubber}
            min={0}
            max={duration}
            step={1}
            value={Math.floor(time)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Afspeelpositie"
            aria-valuetext={`${formatTime(time)} van ${formatTime(duration)}`}
            style={{ "--value": `${(time / duration) * 100}%` } as React.CSSProperties}
          />
          <div className={styles.bar}>
            <button type="button" className={styles.control} onClick={toggle} aria-label={playLabel} title={playLabel}>
              <PlayIcon aria-hidden />
            </button>
            <span className={styles.time} aria-hidden>
              {formatTime(time)} / {formatTime(duration)}
            </span>
            <span className={styles.spacer} />
            <button
              type="button"
              className={clsx(styles.control, styles.speed)}
              onClick={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])}
              aria-label={`Afspeelsnelheid ${formatSpeed(speed)}, klik voor sneller`}
              title="Afspeelsnelheid"
            >
              {formatSpeed(speed)}
            </button>
            <button
              type="button"
              className={styles.control}
              onClick={() => setCaptions((c) => !c)}
              aria-pressed={captions}
              aria-label="Ondertiteling"
              title="Ondertiteling (C)"
            >
              {captions ? <Captions aria-hidden /> : <CaptionsOff aria-hidden />}
            </button>
          </div>
        </div>
      </div>

      <p id={hintId} className="visually-hidden">
        Sneltoetsen: K om af te spelen of te pauzeren, J en L om 5 seconden terug of vooruit te gaan, C voor
        ondertiteling.
      </p>

      <div className={styles.meta}>
        <div className={styles.watched}>
          <span className={styles.watchedTrack} aria-hidden>
            <span className={styles.watchedFill} style={{ width: `${Math.round(progress * 100)}%` }} />
          </span>
          <p aria-live="polite" className={clsx(styles.watchedText, complete && styles.watchedDone)}>
            {complete ? (
              <>
                <Check aria-hidden />
                Video bekeken
              </>
            ) : (
              `${Math.round(progress * 100)}% bekeken · rond af vanaf 90%`
            )}
          </p>
        </div>

        <button
          type="button"
          className={styles.transcriptToggle}
          aria-expanded={transcriptOpen}
          aria-controls={transcriptId}
          onClick={() => setTranscriptOpen((o) => !o)}
        >
          Transcript
          <ChevronDown aria-hidden />
        </button>
      </div>

      <div id={transcriptId} className={clsx(styles.transcript, transcriptOpen && styles.transcriptOpen)}>
        <div className={styles.transcriptInner}>
          <ol className={styles.cues}>
            {transcript.map((c, i) => (
              <li key={c.start}>
                <button
                  type="button"
                  className={clsx(styles.cue, i === cueIndex && time > 0 && styles.cueActive)}
                  aria-current={i === cueIndex && time > 0 ? "true" : undefined}
                  onClick={() => seek(c.start)}
                >
                  <span className={styles.cueTime}>{formatTime(c.start)}</span>
                  <span>{c.text}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
