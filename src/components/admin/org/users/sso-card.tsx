"use client";

import { useState } from "react";
import { Copy, KeyRound, PlugZap, Unplug } from "lucide-react";
import {
  Alert,
  Button,
  ConfirmDialog,
  Dialog,
  Field,
  IconButton,
  RadioCard,
  RadioGroup,
  StatusPill,
  Switch,
  TextInput,
  useToast,
} from "@/components/kit";
import { formatDateTime, formatShortDate, type SsoConnection } from "@/lib/data/admin-org";
import { Panel } from "../panel";
import { wait } from "../utils";
import styles from "./sso-card.module.scss";

const REDIRECT_URI = "https://app.aiacademy.nl/api/auth/callback/sso";

type Provider = "entra" | "google";
const PROVIDERS: Record<Provider, string> = { entra: "Microsoft Entra ID", google: "Google Workspace" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function SsoCard({ initial }: { initial: SsoConnection }) {
  const [sso, setSso] = useState(initial);
  const [testing, setTesting] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const { toast } = useToast();

  async function test() {
    setTesting(true);
    // Straks: testlogin via de identity provider.
    await wait(1000);
    setTesting(false);
    toast({ variant: "success", title: "Verbinding werkt", description: `${sso.provider} reageerde binnen 240 ms.` });
  }

  function enforce(next: boolean) {
    setSso((s) => ({ ...s, enforced: next }));
    toast({
      variant: "success",
      title: next ? "Inloggen alleen via SSO" : "Inloggen per e-mail weer toegestaan",
      description: next
        ? "Collega's met een domeinadres loggen voortaan in met hun werkaccount."
        : "Collega's kunnen ook weer een inloglink per e-mail krijgen.",
    });
  }

  return (
    <Panel
      title="Single sign-on"
      description="Collega's loggen in met hun werkaccount. Wie uit dienst gaat, verliest automatisch toegang."
      actions={
        sso.connected ? <StatusPill variant="success">Verbonden</StatusPill> : <StatusPill>Niet ingesteld</StatusPill>
      }
    >
      {sso.connected ? (
        <div className={styles.stack}>
          <div className={styles.provider}>
            <span className={styles.logo} aria-hidden>
              <KeyRound />
            </span>
            <div className={styles.providerText}>
              <p className={styles.providerName}>{sso.provider}</p>
              <p className={styles.providerMeta}>{sso.tenant}</p>
            </div>
          </div>

          <dl className={styles.details}>
            {sso.connectedAt && (
              <div>
                <dt>Gekoppeld sinds</dt>
                <dd>{formatShortDate(sso.connectedAt)}</dd>
              </div>
            )}
            {sso.lastSyncAt && (
              <div>
                <dt>Laatste synchronisatie</dt>
                <dd>{formatDateTime(sso.lastSyncAt)}</dd>
              </div>
            )}
          </dl>

          <Switch
            label="Alleen inloggen via SSO"
            description="Zet inloggen met een link per e-mail uit voor iedereen met een domeinadres."
            checked={sso.enforced}
            onCheckedChange={enforce}
          />

          <div className={styles.buttons}>
            <Button variant="secondary" size="sm" icon={<PlugZap />} loading={testing} onClick={test}>
              Verbinding testen
            </Button>
            <Button variant="ghost" size="sm" icon={<Unplug />} onClick={() => setDisconnectOpen(true)}>
              Ontkoppelen
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.stack}>
          <p className={styles.text}>
            Koppel Microsoft Entra ID of Google Workspace. Dat duurt ongeveer tien minuten en je hebt er een beheerder
            van jullie identity provider bij nodig.
          </p>
          <div>
            <Button icon={<KeyRound />} onClick={() => setSetupOpen(true)}>
              SSO instellen
            </Button>
          </div>
        </div>
      )}

      <SetupDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onConnected={(provider, tenant) => {
          const now = new Date().toISOString();
          setSso({ provider, tenant, connected: true, connectedAt: now, lastSyncAt: now, enforced: false });
          toast({ variant: "success", title: "Single sign-on gekoppeld", description: `${provider} is verbonden.` });
        }}
      />

      <ConfirmDialog
        open={disconnectOpen}
        onOpenChange={setDisconnectOpen}
        variant="danger"
        title="Single sign-on ontkoppelen?"
        description="Collega's loggen daarna in met een link per e-mail. Lopende sessies blijven actief."
        confirmLabel="Ontkoppelen"
        onConfirm={async () => {
          // Straks: server action die de koppeling verwijdert.
          await wait(800);
          setSso((s) => ({ ...s, connected: false, enforced: false }));
          toast({ title: "Single sign-on ontkoppeld" });
        }}
      />
    </Panel>
  );
}

function SetupDialog({
  open,
  onOpenChange,
  onConnected,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: (provider: string, tenant: string) => void;
}) {
  const [provider, setProvider] = useState<Provider>("entra");
  const [tenant, setTenant] = useState("");
  const [clientId, setClientId] = useState("");
  const [secret, setSecret] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"tenant" | "clientId" | "secret", string>>>({});
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (provider === "entra" && !UUID.test(tenant.trim())) next.tenant = "Vul een geldige tenant-ID in (een GUID).";
    if (provider === "google" && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(tenant.trim()))
      next.tenant = "Vul het domein van jullie Workspace in.";
    if (!clientId.trim()) next.clientId = "Vul de client-ID in.";
    if (secret.trim().length < 8) next.secret = "Vul het clientgeheim in.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    // Straks: server action die de gegevens versleuteld opslaat en een testlogin doet.
    await wait(1200);
    setBusy(false);
    onConnected(PROVIDERS[provider], tenant.trim());
    onOpenChange(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(REDIRECT_URI);
      toast({ title: "Redirect-URI gekopieerd" });
    } catch {
      toast({ variant: "error", title: "Kopiëren lukte niet" });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
      title="Single sign-on instellen"
      description="Registreer AI Academy als app bij je identity provider en vul hier de gegevens in."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            Annuleren
          </Button>
          <Button type="submit" form="sso-form" loading={busy}>
            Koppelen en testen
          </Button>
        </>
      }
    >
      <form id="sso-form" className={styles.form} onSubmit={submit} noValidate>
        <RadioGroup
          label="Identity provider"
          value={provider}
          onValueChange={(v) => {
            setProvider(v as Provider);
            setErrors({});
          }}
          columns={2}
        >
          <RadioCard value="entra" title="Microsoft Entra ID" description="Voorheen Azure Active Directory." />
          <RadioCard value="google" title="Google Workspace" description="Voor organisaties met Google-accounts." />
        </RadioGroup>

        <Field label="Redirect-URI" description="Plak deze bij de app-registratie.">
          <TextInput
            value={REDIRECT_URI}
            readOnly
            onFocus={(e) => e.currentTarget.select()}
            suffix={
              <IconButton label="Redirect-URI kopiëren" icon={<Copy />} variant="ghost" size="sm" onClick={copy} />
            }
          />
        </Field>

        <Field
          label={provider === "entra" ? "Tenant-ID" : "Workspace-domein"}
          required
          error={errors.tenant}
          description={provider === "entra" ? "Te vinden onder Overzicht in het Entra-beheercentrum." : undefined}
        >
          <TextInput
            value={tenant}
            onChange={(e) => setTenant(e.target.value)}
            placeholder={provider === "entra" ? "00000000-0000-0000-0000-000000000000" : "studionoord.nl"}
            autoComplete="off"
            spellCheck={false}
          />
        </Field>

        <div className={styles.row}>
          <Field label="Client-ID" required error={errors.clientId}>
            <TextInput
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <Field label="Clientgeheim" required error={errors.secret}>
            <TextInput
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
        </div>

        <Alert variant="info">We bewaren het clientgeheim versleuteld en tonen het daarna nooit meer.</Alert>
      </form>
    </Dialog>
  );
}
