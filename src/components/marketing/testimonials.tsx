import clsx from "clsx";
import { Avatar } from "@/components/kit";
import type { ProofStat, Testimonial } from "@/lib/data/marketing";
import styles from "./testimonials.module.scss";

type Props = {
  items: Testimonial[];
  /** Optionele cijfers onder de citaten. */
  stats?: ProofStat[];
};

// Citaten van klanten; de eerste krijgt meer ruimte.
export function Testimonials({ items, stats }: Props) {
  if (items.length === 0) return null;

  return (
    <div className={styles.wrap}>
      <ul className={styles.grid}>
        {items.map((item, i) => (
          <li key={item.name} className={clsx(styles.item, i === 0 && styles.featured)}>
            <figure className={styles.card}>
              <span className={styles.mark} aria-hidden>
                “
              </span>
              <blockquote className={styles.quote}>
                <p>{item.quote}</p>
              </blockquote>
              <figcaption className={styles.person}>
                <Avatar initials={item.initials} size={36} />
                <span className={styles.who}>
                  <span className={styles.name}>{item.name}</span>
                  <span className={styles.role}>
                    {item.role} · {item.company}
                  </span>
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      {stats && stats.length > 0 && (
        <dl className={styles.stats}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <dt className={styles.statLabel}>{stat.label}</dt>
              <dd className={styles.statValue}>{stat.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
