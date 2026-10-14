"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Check } from "lucide-react";
import type { LearningPath } from "@/lib/types";
import { ArrowButton, Eyebrow, Tag, Tags } from "./ui";
import { TopicIcon } from "./topic-icon";
import styles from "./specialisation-picker.module.scss";

export function SpecialisationPicker({ paths }: { paths: LearningPath[] }) {
  const [selected, setSelected] = useState(paths[0]?.slug);
  const chosen = paths.find((p) => p.slug === selected);

  return (
    <>
      <div role="radiogroup" aria-label="Specialisatie" className={styles.options}>
        {paths.map((path) => {
          const isSelected = path.slug === selected;
          const chapterCount = path.topics.reduce((n, t) => n + t.chapters.length, 0);
          return (
            <div
              key={path.slug}
              role="radio"
              tabIndex={0}
              aria-checked={isSelected}
              className={clsx(styles.option, isSelected && styles.selected)}
              onClick={() => setSelected(path.slug)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  setSelected(path.slug);
                }
              }}
            >
              <div className={styles.optionHead}>
                <div>
                  <Eyebrow className={styles.audience}>{path.audience}</Eyebrow>
                  <h2 className={styles.optionTitle}>{path.title}</h2>
                </div>
                <span className={styles.radio}>{isSelected && <Check />}</span>
              </div>
              <p className={styles.optionText}>{path.description}</p>
              <Tags>
                <Tag>{path.topics.length} onderwerpen</Tag>
                <Tag>{chapterCount} hoofdstukken</Tag>
                <Tag>{path.level}</Tag>
              </Tags>
              <ul className={styles.topics}>
                {path.topics.map((topic) => (
                  <li key={topic.id}>
                    <span className={styles.topicIcon}>
                      <TopicIcon name={topic.icon} strokeWidth={1.75} />
                    </span>
                    {topic.title}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className={styles.actions}>
        {chosen && (
          <ArrowButton href={`/leerpaden/${chosen.slug}`}>
            {/* Alle labels gestapeld: vaste knopbreedte en een crossfade bij wisselen. */}
            <span className={styles.ctaLabels}>
              {paths.map((path) => (
                <span
                  key={path.slug}
                  aria-hidden={path.slug !== selected}
                  className={clsx(styles.ctaLabel, path.slug === selected && styles.ctaActive)}
                >
                  Start {path.title}
                </span>
              ))}
            </span>
          </ArrowButton>
        )}
        <Link href="/dashboard" className={styles.later}>
          Later kiezen
        </Link>
        <Link href="/profiel/certificaten/ai-101" className={styles.certificate}>
          Bekijk je certificaat
        </Link>
      </div>
    </>
  );
}
