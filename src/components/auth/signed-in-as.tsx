import { LogOut } from "lucide-react";
import { Avatar } from "@/components/ui";
import { signOutAction } from "@/server/actions/auth";
import styles from "./signed-in-as.module.scss";

// "Ingelogd als … · Uitloggen": zodat je altijd van account kunt wisselen, ook tijdens de intake.
export function SignedInAs({ name, email, initials }: { name: string; email: string; initials: string }) {
  return (
    <div className={styles.row}>
      <Avatar initials={initials} size={28} />
      <p className={styles.text}>
        Ingelogd als <strong>{name || email}</strong>
        {name && <span className={styles.email}> · {email}</span>}
      </p>
      <form action={signOutAction}>
        <button type="submit" className={styles.logout}>
          <LogOut aria-hidden />
          Uitloggen
        </button>
      </form>
    </div>
  );
}
