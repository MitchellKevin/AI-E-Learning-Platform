"use client";

import { Award, LayoutGrid, LifeBuoy, LogOut, Settings, User } from "lucide-react";
import { Avatar, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, useToast } from "@/components/kit";
import styles from "./user-menu.module.scss";

export type ShellUser = {
  name: string;
  initials: string;
  email: string;
  team: string;
  organisation: string;
  canManage: boolean;
};

export function UserMenu({ user }: { user: ShellUser }) {
  const { toast } = useToast();

  return (
    <Menu>
      <MenuTrigger aria-label={`Accountmenu van ${user.name}`} className={styles.trigger}>
        <Avatar initials={user.initials} size={36} />
      </MenuTrigger>
      <MenuContent align="end" width={272}>
        <div role="presentation" className={styles.account}>
          <Avatar initials={user.initials} size={40} />
          <div className={styles.accountText}>
            <p className={styles.name}>{user.name}</p>
            <p className={styles.email}>{user.email}</p>
          </div>
        </div>
        <MenuSeparator />
        <MenuItem href="/profiel" icon={<User />}>
          Mijn profiel
        </MenuItem>
        <MenuItem href="/profiel/certificaten" icon={<Award />}>
          Certificaten
        </MenuItem>
        <MenuItem href="/instellingen" icon={<Settings />}>
          Instellingen
        </MenuItem>
        {user.canManage && (
          <>
            <MenuSeparator />
            <MenuItem href="/beheer" icon={<LayoutGrid />} description={`Team ${user.team} · ${user.organisation}`}>
              Beheer
            </MenuItem>
          </>
        )}
        <MenuSeparator />
        <MenuItem href="/help" icon={<LifeBuoy />}>
          Help
        </MenuItem>
        <MenuItem
          href="/inloggen"
          icon={<LogOut />}
          danger
          // Later: signOut() van Auth.js; nu alleen terug naar het inlogscherm.
          onSelect={() => toast({ title: "Je bent uitgelogd", description: "Tot de volgende les!" })}
        >
          Uitloggen
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
