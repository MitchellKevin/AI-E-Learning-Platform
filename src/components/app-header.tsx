import Link from "next/link";
import { getCurrentUser, getStats } from "@/lib/user-data";
import { canManage, getNotifications, getSearchIndex, getShellAccount } from "@/lib/data/shell";
import { formatNumber } from "@/lib/format";
import { CommandPalette } from "./shell/command-palette";
import { NotificationsMenu } from "./shell/notifications-menu";
import { UserMenu, type ShellUser } from "./shell/user-menu";
import { MobileNav } from "./shell/mobile-nav";
import { MainNav } from "./main-nav";
import styles from "./app-header.module.scss";

export async function AppHeader() {
  const [user, stats, account, notifications, searchIndex] = await Promise.all([
    getCurrentUser(),
    getStats(),
    getShellAccount(),
    getNotifications(),
    getSearchIndex(),
  ]);

  const shellUser: ShellUser = {
    name: `${user.firstName} ${user.lastName}`,
    initials: user.initials,
    email: account.email,
    team: account.team,
    organisation: account.organisation,
    canManage: canManage(account),
  };
  const points = formatNumber(stats.points);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/dashboard" className={styles.logo} aria-label="AI Academy, naar je dashboard">
          <span className={styles.logoMark} aria-hidden>
            AI
          </span>
          <span aria-hidden>Academy</span>
        </Link>
        <MainNav />
        <div className={styles.actions}>
          <CommandPalette index={searchIndex} />
          {/* Streak en punten alleen als er naast de navigatie ruimte voor is. */}
          <Link href="/profiel" className={styles.pill} title="Bekijk je profiel">
            <strong>{stats.streak}</strong> dagen streak
          </Link>
          <Link href="/leaderboard" className={styles.pill} title="Bekijk het leaderboard">
            <strong>{points}</strong> punten
          </Link>
          <NotificationsMenu notifications={notifications} />
          <UserMenu user={shellUser} />
          <MobileNav user={shellUser} points={points} streak={stats.streak} />
        </div>
      </div>
    </header>
  );
}
