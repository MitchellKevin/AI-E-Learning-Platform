"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  Building2,
  CalendarCheck,
  CalendarClock,
  Check,
  CircleDashed,
  ClipboardCheck,
  CodeXml,
  GraduationCap,
  Palette,
  RotateCcw,
  Timer,
  UsersRound,
} from "lucide-react";
import {
  Alert,
  Button,
  Field,
  Radio,
  RadioCard,
  RadioGroup,
  SegmentedControl,
  Tag,
  Tags,
  TextInput,
  useToast,
} from "@/components/kit";
import type { LevelTestQuestion, OnboardingOptions, OnboardingProfile } from "@/lib/data/auth";
import { completeOnboarding } from "@/server/actions/onboarding";
import { formatDate } from "@/lib/format";
import { GoalChips } from "./goal-chips";
import { OnboardingProgress } from "./onboarding-progress";
import { StepFrame } from "./step-frame";
import styles from "./onboarding-flow.module.scss";

const steps = [
  { id: "welkom", label: "Welkom" },
  { id: "rol", label: "Je rol" },
  { id: "ervaring", label: "Ervaring" },
  { id: "doel", label: "Doelen" },
  { id: "weekdoel", label: "Weekdoel" },
  { id: "niveautoets", label: "Niveautoets" },
] as const;

type StepId = (typeof steps)[number]["id"];
type Screen = StepId | "toets" | "uitslag" | "klaar";

const MAX_GOALS = 3;
const MIN_MINUTES = 15;
const MAX_MINUTES = 600;

const roleIcons: Record<string, ReactNode> = {
  designer: <Palette />,
  developer: <CodeXml />,
  anders: <UsersRound />,
};

export type OnboardingFlowProps = {
  profile: OnboardingProfile;
  options: OnboardingOptions;
  levelTest: LevelTestQuestion[];
  /** Het toegewezen leerpad, voor de schatting en de uitslag van de niveautoets. */
  path: { title: string; hours: number; topics: { id: string; title: string; chapters: number }[] };
};

export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} uur en ${rest} min` : `${hours} uur`;
}

const addWeeks = (date: Date, weeks: number) => new Date(date.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);

// Intake na de uitnodiging. Alles leeft in deze component; opslaan gebeurt pas bij de laatste stap.
export function OnboardingFlow({ profile, options, levelTest, path }: OnboardingFlowProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [screen, setScreen] = useState<Screen>("welkom");
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  // Pas na de eerste navigatie de focus verplaatsen; bij het laden blijft die bovenaan de pagina.
  const [navigated, setNavigated] = useState(false);
  // Aangepast vanuit het overzicht: "Opslaan" brengt je daar weer terug.
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [announcement, setAnnouncement] = useState("");
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [role, setRole] = useState<string>();
  const [level, setLevel] = useState<string>();
  const [goals, setGoals] = useState<string[]>([]);
  const [weekGoal, setWeekGoal] = useState(String(options.weekGoals[1] ?? options.weekGoals[0]));
  const [customMinutes, setCustomMinutes] = useState("");
  const [reminder, setReminder] = useState(options.reminders[1]?.value ?? options.reminders[0].value);
  const [question, setQuestion] = useState(0);
  // Antwoorden van de lopende poging; pas bij de uitslag worden ze de echte uitslag.
  const [draft, setDraft] = useState<(number | undefined)[]>([]);
  const [answers, setAnswers] = useState<(number | undefined)[]>([]);
  const [test, setTest] = useState<"open" | "skipped" | "done">("open");

  const stepIndex =
    screen === "klaar" ? steps.length : screen === "toets" || screen === "uitslag" ? 5 : steps.findIndex((s) => s.id === screen);
  const minutes = weekGoal === "anders" ? Number.parseInt(customMinutes, 10) : Number(weekGoal);
  const correct = levelTest.filter((q, i) => answers[i] === q.answer);
  const knownTopics = new Set(correct.map((q) => q.topicId));

  function go(next: Screen, dir: "forward" | "back" = "forward") {
    setDirection(dir);
    setNavigated(true);
    setErrors({});
    setAnnouncement("");
    setScreen(next);
  }

  // Bij een fout: melding tonen en voorlezen. Geeft false terug zodat StepFrame de focus verplaatst.
  function fail(key: string, message: string) {
    setErrors({ [key]: message });
    // Een spatie erbij als het dezelfde melding is, anders leest de screenreader hem niet opnieuw voor.
    setAnnouncement((prev) => (prev === message ? `${message}\u00a0` : message));
    return false;
  }

  // Volgende stap, of terug naar het overzicht als je iets aan het wijzigen was.
  function next(target: Screen) {
    if (editing) {
      setEditing(false);
      go("klaar");
    } else {
      go(target);
    }
  }

  function edit(target: Screen) {
    setEditing(true);
    go(target, "back");
  }

  function startTest() {
    setDraft([]);
    setQuestion(0);
    go("toets");
  }

  const backButton = (target: Screen, label = "Terug") => (
    <Button variant="ghost" icon={<ArrowLeft />} onClick={() => go(target, "back")}>
      {label}
    </Button>
  );

  const nextLabel = editing ? "Opslaan" : "Volgende";
  const nextIcon = editing ? <Check /> : <ArrowRight />;

  async function finish() {
    setSaving(true);
    try {
      await completeOnboarding({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        level,
        goals,
        weekGoal: minutes,
        reminder: reminder as "dagelijks" | "wekelijks" | "geen",
        levelTest: test === "done" ? "gedaan" : test === "skipped" ? "overgeslagen" : undefined,
        knownTopics: [...knownTopics],
      });
    } catch {
      setSaving(false);
      toast({ variant: "error", title: "Opslaan lukte niet", description: "Probeer het nog een keer." });
      return;
    }
    toast({
      variant: "success",
      title: "Je leerplan staat klaar",
      description: `Veel plezier met ${path.title}, ${firstName.trim()}!`,
    });
    router.push("/dashboard");
    router.refresh();
  }

  let content: ReactNode;

  switch (screen) {
    case "welkom":
      content = (
        <StepFrame
          eyebrow={`Welkom bij ${profile.organisation}`}
          title={`Hoi ${profile.firstName}, fijn dat je er bent`}
          lead="In zes korte stappen stemmen we AI Academy af op jou. Dat duurt ongeveer twee minuten, en je kunt alles later nog aanpassen."
          focusHeading={navigated}
          direction={direction}
          onSubmit={() => {
            if (!firstName.trim()) return fail("firstName", "Vul je voornaam in.");
            if (!lastName.trim()) return fail("lastName", "Vul je achternaam in.");
            next("rol");
          }}
          actions={
            <Button type="submit" size="lg" iconRight={nextIcon}>
              {editing ? "Opslaan" : "Aan de slag"}
            </Button>
          }
        >
          <div className={styles.assignment}>
            <span className={styles.assignmentIcon} aria-hidden>
              <Building2 />
            </span>
            <p>
              <strong>{profile.organisation}</strong> heeft <strong>{profile.assignedPath.title}</strong> voor je
              klaargezet in team {profile.team}.
              {profile.assignedPath.deadline && (
                <span className={styles.assignmentMeta}>
                  {" "}
                  Rond het af vóór {formatDate(profile.assignedPath.deadline)}.
                </span>
              )}
            </p>
          </div>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Klopt je naam?</legend>
            <p className={styles.legendHint}>Zo staat hij straks op je profiel en op je certificaten.</p>
            <div className={styles.nameGrid}>
              <Field label="Voornaam" required error={errors.firstName}>
                <TextInput
                  name="voornaam"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </Field>
              <Field label="Achternaam" required error={errors.lastName}>
                <TextInput
                  name="achternaam"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Field>
            </div>
            <p className={styles.emailLine}>
              Je logt in met <span className={styles.email}>{profile.email}</span>
            </p>
          </fieldset>
        </StepFrame>
      );
      break;

    case "rol":
      content = (
        <StepFrame
          eyebrow="Stap 2 · Je rol"
          title="Wat voor werk doe je?"
          lead="Zo kiezen we voorbeelden en oefeningen die bij je vak passen. AI 101 volgt iedereen; daarna kies je een specialisatie."
          focusHeading={navigated}
          direction={direction}
          onSubmit={() => (role ? next("ervaring") : fail("role", "Kies de rol die het best bij je past."))}
          back={editing ? undefined : backButton("welkom")}
          actions={
            <Button type="submit" size="lg" iconRight={nextIcon}>
              {nextLabel}
            </Button>
          }
        >
          <RadioGroup
            label="Je rol"
            hideLabel
            name="rol"
            value={role}
            onValueChange={(value) => {
              setRole(value);
              setErrors({});
            }}
            error={errors.role}
          >
            {options.roles.map((option) => (
              <RadioCard
                key={option.value}
                value={option.value}
                title={option.title}
                eyebrow={option.eyebrow}
                description={option.description}
                icon={roleIcons[option.value] ?? <UsersRound />}
              >
                {option.recommendedPath && (
                  <span className={styles.cardHint}>
                    <GraduationCap aria-hidden />
                    Na AI 101: {option.recommendedPath}
                  </span>
                )}
              </RadioCard>
            ))}
          </RadioGroup>
        </StepFrame>
      );
      break;

    case "ervaring":
      content = (
        <StepFrame
          eyebrow="Stap 3 · Ervaring"
          title="Hoeveel ervaring heb je met AI?"
          lead="Er is geen goed of fout antwoord. We stemmen de uitleg en het tempo af op waar je nu staat."
          focusHeading={navigated}
          direction={direction}
          onSubmit={() => (level ? next("doel") : fail("level", "Kies het niveau dat het best bij je past."))}
          back={editing ? undefined : backButton("rol")}
          actions={
            <Button type="submit" size="lg" iconRight={nextIcon}>
              {nextLabel}
            </Button>
          }
        >
          <RadioGroup
            label="Je ervaring met AI"
            hideLabel
            name="ervaring"
            columns={2}
            value={level}
            onValueChange={(value) => {
              setLevel(value);
              setErrors({});
            }}
            error={errors.level}
          >
            {options.levels.map((option, index) => (
              <RadioCard
                key={option.value}
                value={option.value}
                title={option.title}
                description={option.description}
                icon={<LevelBars value={index + 1} max={options.levels.length} />}
              />
            ))}
          </RadioGroup>
        </StepFrame>
      );
      break;

    case "doel":
      content = (
        <StepFrame
          eyebrow="Stap 4 · Doelen"
          title="Wat wil je bereiken?"
          lead={`Kies maximaal ${MAX_GOALS} doelen. Op je dashboard zie je welke hoofdstukken daar het meest bij helpen.`}
          focusHeading={navigated}
          direction={direction}
          onSubmit={() => (goals.length ? next("weekdoel") : fail("goals", "Kies minimaal één doel."))}
          back={editing ? undefined : backButton("ervaring")}
          actions={
            <Button type="submit" size="lg" iconRight={nextIcon}>
              {nextLabel}
            </Button>
          }
        >
          <GoalChips
            label="Je doelen"
            options={options.goals}
            value={goals}
            max={MAX_GOALS}
            onValueChange={(value) => {
              setGoals(value);
              setErrors({});
            }}
            error={errors.goals}
          />
        </StepFrame>
      );
      break;

    case "weekdoel":
      content = (
        <StepFrame
          eyebrow="Stap 5 · Weekdoel"
          title="Hoeveel tijd wil je per week leren?"
          lead="Een vast weekdoel helpt om het vol te houden. Kleine blokjes werken het best: een hoofdstuk duurt zo'n twintig minuten."
          focusHeading={navigated}
          direction={direction}
          onSubmit={() => {
            if (weekGoal === "anders" && !(minutes >= MIN_MINUTES && minutes <= MAX_MINUTES)) {
              return fail(
                "minutes",
                `Kies een weekdoel tussen ${MIN_MINUTES} en ${MAX_MINUTES} minuten.`,
              );
            }
            next("niveautoets");
          }}
          back={editing ? undefined : backButton("doel")}
          actions={
            <Button type="submit" size="lg" iconRight={nextIcon}>
              {nextLabel}
            </Button>
          }
        >
          <div className={styles.group}>
            <p className={styles.legend} aria-hidden>
              Minuten per week
            </p>
            <SegmentedControl
              label="Weekdoel in minuten per week"
              name="weekdoel"
              fullWidth
              value={weekGoal}
              onValueChange={(value) => {
                setWeekGoal(value);
                setErrors({});
              }}
              options={[
                ...options.weekGoals.map((m) => ({ value: String(m), label: formatMinutes(m) })),
                { value: "anders", label: "Anders" },
              ]}
            />
            {weekGoal === "anders" && (
              <Field
                label="Minuten per week"
                description={`Tussen ${MIN_MINUTES} en ${MAX_MINUTES} minuten.`}
                error={errors.minutes}
                className={styles.custom}
              >
                <TextInput
                  type="number"
                  name="minuten"
                  inputMode="numeric"
                  min={MIN_MINUTES}
                  max={MAX_MINUTES}
                  step={15}
                  placeholder="90"
                  suffix="min"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                />
              </Field>
            )}
            <WeekEstimate minutes={minutes} hours={path.hours} title={path.title} deadline={profile.assignedPath.deadline} />
          </div>

          <RadioGroup
            label="Herinneringen"
            description="We sturen je een korte mail of melding, nooit meer dan één per dag."
            name="herinneringen"
            value={reminder}
            onValueChange={setReminder}
          >
            {options.reminders.map((option) => (
              <Radio key={option.value} value={option.value} label={option.label} description={option.description} />
            ))}
          </RadioGroup>
        </StepFrame>
      );
      break;

    case "niveautoets":
      content = (
        <StepFrame
          eyebrow="Stap 6 · Niveautoets"
          title={test === "done" ? "Je hebt de niveautoets gedaan" : "Wil je een korte niveautoets doen?"}
          lead={
            test === "done"
              ? `Je had ${correct.length} van de ${levelTest.length} vragen goed. Je kunt de toets opnieuw doen of verdergaan.`
              : `${levelTest.length} vragen, ongeveer drie minuten. Heb je een vraag goed, dan markeren we dat onderwerp van ${path.title} als bekend, zodat je het kunt overslaan.`
          }
          focusHeading={navigated}
          direction={direction}
          onSubmit={() => {
            if (test === "done") {
              next("klaar");
              return;
            }
            startTest();
          }}
          back={editing ? undefined : backButton("weekdoel")}
          actions={
            test === "done" ? (
              <>
                <Button
                  variant="secondary"
                  size="lg"
                  icon={<RotateCcw />}
                  onClick={startTest}
                >
                  Opnieuw doen
                </Button>
                <Button type="submit" size="lg" iconRight={<ArrowRight />}>
                  Verder
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    setTest("skipped");
                    next("klaar");
                  }}
                >
                  Overslaan
                </Button>
                <Button type="submit" size="lg" icon={<ClipboardCheck />}>
                  Start niveautoets
                </Button>
              </>
            )
          }
        >
          {level === "nieuw" && test !== "done" && (
            <Alert variant="info">
              Je gaf aan dat AI nog nieuw voor je is. Overslaan is dan prima: {path.title} begint bij de basis.
            </Alert>
          )}
          <ul className={styles.topicList} aria-label={`Onderwerpen van ${path.title}`}>
            {path.topics.map((topic) => {
              const known = test === "done" && knownTopics.has(topic.id);
              return (
                <li key={topic.id} className={clsx(known && styles.known)}>
                  <span className={styles.topicIcon} aria-hidden>
                    {known ? <Check /> : <CircleDashed />}
                  </span>
                  <span className={styles.topicTitle}>{topic.title}</span>
                  <span className={styles.topicMeta}>
                    {known ? "Kun je overslaan" : `${topic.chapters} hoofdstukken`}
                  </span>
                </li>
              );
            })}
          </ul>
          {test !== "done" && (
            <p className={styles.smallPrint}>
              De uitslag telt niet mee voor je punten of je certificaat. Alleen jij ziet hem.
            </p>
          )}
        </StepFrame>
      );
      break;

    case "toets": {
      const q = levelTest[question];
      const last = question === levelTest.length - 1;
      content = (
        <StepFrame
          // Nieuwe key per vraag: elke vraag schuift opnieuw in en krijgt focus.
          key={q.id}
          eyebrow={`Niveautoets · vraag ${question + 1} van ${levelTest.length}`}
          title={q.question}
          focusHeading
          direction={direction}
          onSubmit={() => {
            if (draft[question] === undefined) return fail("answer", "Kies een antwoord om verder te gaan.");
            if (last) {
              setAnswers(draft);
              setTest("done");
              go("uitslag");
            } else {
              setQuestion(question + 1);
              go("toets");
            }
          }}
          back={
            question === 0 ? (
              backButton("niveautoets", "Stoppen")
            ) : (
              <Button
                variant="ghost"
                icon={<ArrowLeft />}
                onClick={() => {
                  setQuestion(question - 1);
                  go("toets", "back");
                }}
              >
                Vorige vraag
              </Button>
            )
          }
          actions={
            <Button type="submit" size="lg" iconRight={<ArrowRight />}>
              {last ? "Bekijk uitslag" : "Volgende vraag"}
            </Button>
          }
        >
          <div className={styles.questionDots} aria-hidden>
            {levelTest.map((item, i) => (
              <span
                key={item.id}
                className={clsx(styles.dot, i < question && styles.dotDone, i === question && styles.dotActive)}
              />
            ))}
          </div>
          <RadioGroup
            label={q.question}
            hideLabel
            name={`vraag-${q.id}`}
            value={draft[question] === undefined ? undefined : String(draft[question])}
            onValueChange={(value) => {
              const copy = [...draft];
              copy[question] = Number(value);
              setDraft(copy);
              setErrors({});
            }}
            error={errors.answer}
          >
            {q.options.map((option, i) => (
              <Radio key={option} value={String(i)} label={option} className={styles.answer} />
            ))}
          </RadioGroup>
        </StepFrame>
      );
      break;
    }

    case "uitslag": {
      const score = correct.length;
      const total = levelTest.length;
      const verdict =
        score === total
          ? "Indrukwekkend. Je kent de basis al goed; je kunt meteen door naar de verdieping."
          : score >= total - 2
            ? "Een sterke basis. De onderwerpen die je al kent, kun je overslaan."
            : score > 0
              ? "Een goed vertrekpunt. We beginnen bij de onderwerpen die nog nieuw voor je zijn."
              : "Geen zorgen: daar is AI 101 precies voor. Je begint gewoon bij het begin.";
      content = (
        <StepFrame
          eyebrow="Niveautoets · uitslag"
          title={`${score} van de ${total} vragen goed`}
          lead={verdict}
          focusHeading
          direction={direction}
          onSubmit={() => next("klaar")}
          back={
            <Button
              variant="ghost"
              icon={<RotateCcw />}
              onClick={() => {
                setDraft([]);
                setQuestion(0);
                go("toets", "back");
              }}
            >
              Opnieuw doen
            </Button>
          }
          actions={
            <Button type="submit" size="lg" iconRight={<ArrowRight />}>
              Bekijk je leerplan
            </Button>
          }
        >
          <div className={styles.score} aria-hidden>
            {levelTest.map((q, i) => (
              <span key={q.id} className={clsx(styles.scoreBar, answers[i] === q.answer && styles.scoreBarGood)} />
            ))}
          </div>
          <ul className={styles.topicList} aria-label="Uitslag per onderwerp">
            {path.topics.map((topic) => {
              const known = knownTopics.has(topic.id);
              return (
                <li key={topic.id} className={clsx(known && styles.known)}>
                  <span className={styles.topicIcon} aria-hidden>
                    {known ? <Check /> : <CircleDashed />}
                  </span>
                  <span className={styles.topicTitle}>{topic.title}</span>
                  <span className={styles.topicMeta}>{known ? "Kun je overslaan" : "Nog te leren"}</span>
                </li>
              );
            })}
          </ul>
        </StepFrame>
      );
      break;
    }

    case "klaar": {
      const roleTitle = options.roles.find((r) => r.value === role)?.title;
      const levelTitle = options.levels.find((l) => l.value === level)?.title;
      const reminderLabel = options.reminders.find((r) => r.value === reminder)?.label;
      const skippable = test === "done" ? path.topics.filter((t) => knownTopics.has(t.id)) : [];
      content = (
        <StepFrame
          eyebrow="Alles staat klaar"
          title={`Je leerplan staat klaar, ${firstName.trim() || profile.firstName}`}
          lead="Controleer je keuzes. Je kunt ze later altijd aanpassen bij je instellingen."
          focusHeading={navigated}
          direction={direction}
          onSubmit={() => {
            if (!saving) void finish();
          }}
          back={backButton(test === "done" ? "uitslag" : "niveautoets")}
          actions={
            <Button type="submit" size="lg" loading={saving} iconRight={<ArrowRight />}>
              Naar je dashboard
            </Button>
          }
        >
          <div className={styles.plan}>
            <span className={styles.planIcon} aria-hidden>
              <GraduationCap />
            </span>
            <div className={styles.planText}>
              <p className={styles.planTitle}>Je begint met {path.title}</p>
              <p className={styles.planMeta}>
                {path.topics.length} onderwerpen · ongeveer {path.hours} uur
                {skippable.length > 0 &&
                  ` · ${skippable.length} ${skippable.length === 1 ? "onderwerp" : "onderwerpen"} kun je overslaan`}
              </p>
            </div>
          </div>

          <dl className={styles.summary}>
            <SummaryRow label="Naam" onEdit={() => edit("welkom")}>
              {`${firstName.trim()} ${lastName.trim()}`}
            </SummaryRow>
            <SummaryRow label="Rol" onEdit={() => edit("rol")}>
              {roleTitle}
            </SummaryRow>
            <SummaryRow label="Ervaring" onEdit={() => edit("ervaring")}>
              {levelTitle}
            </SummaryRow>
            <SummaryRow label="Doelen" onEdit={() => edit("doel")}>
              <Tags>
                {goals.map((value) => (
                  <Tag key={value} variant="brand">
                    {options.goals.find((g) => g.value === value)?.label}
                  </Tag>
                ))}
              </Tags>
            </SummaryRow>
            <SummaryRow label="Weekdoel" onEdit={() => edit("weekdoel")}>
              <span className={styles.summaryLine}>
                <Timer aria-hidden />
                {formatMinutes(minutes)} per week
              </span>
              <span className={styles.summaryLine}>
                <BellRing aria-hidden />
                {reminderLabel}
              </span>
            </SummaryRow>
            <SummaryRow label="Niveautoets" onEdit={() => edit("niveautoets")}>
              {test === "done" ? `${correct.length} van de ${levelTest.length} goed` : "Overgeslagen"}
            </SummaryRow>
          </dl>
        </StepFrame>
      );
      break;
    }
  }

  return (
    <div className={styles.flow}>
      <OnboardingProgress
        steps={[...steps]}
        current={stepIndex}
        onSelect={
          saving || screen === "toets"
            ? undefined
            : (index) => {
                // Vanuit het overzicht werkt een stap aanklikken als "Wijzig".
                if (screen === "klaar") return edit(steps[index].id);
                setEditing(false);
                go(steps[index].id, "back");
              }
        }
      />
      <div className={styles.card}>
        {/* Nieuwe key per scherm, zodat de stapwissel-animatie opnieuw speelt. */}
        <div key={screen}>
          {content}
        </div>
      </div>
      <p className={styles.footnote}>
        Vragen over je account? <Link href="/help">Bekijk het helpcenter</Link> of vraag het je beheerder.
      </p>
      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

function SummaryRow({ label, onEdit, children }: { label: string; onEdit: () => void; children: ReactNode }) {
  return (
    <div className={styles.summaryRow}>
      <dt>{label}</dt>
      <dd>{children}</dd>
      <dd className={styles.summaryAction}>
        <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`Wijzig ${label.toLowerCase()}`}>
          Wijzig
        </Button>
      </dd>
    </div>
  );
}

// Signaalbalkjes als icoon voor het ervaringsniveau.
function LevelBars({ value, max }: { value: number; max: number }) {
  const width = 4;
  const gap = 2;
  return (
    <svg viewBox={`0 0 ${max * (width + gap) - gap} 16`} aria-hidden focusable="false">
      {Array.from({ length: max }, (_, i) => {
        const height = 4 + (12 / max) * (i + 1) - 12 / max;
        return (
          <rect
            key={i}
            x={i * (width + gap)}
            y={16 - height}
            width={width}
            height={height}
            rx={1}
            fill="currentColor"
            opacity={i < value ? 1 : 0.25}
          />
        );
      })}
    </svg>
  );
}

// Wanneer je het leerpad afrondt met dit weekdoel, vergeleken met de deadline.
function WeekEstimate({
  minutes,
  hours,
  title,
  deadline,
}: {
  minutes: number;
  hours: number;
  title: string;
  deadline?: string;
}) {
  if (!(minutes >= MIN_MINUTES && minutes <= MAX_MINUTES)) return null;

  const today = new Date();
  const weeks = Math.ceil((hours * 60) / minutes);
  const finish = addWeeks(today, weeks);
  const deadlineDate = deadline ? new Date(deadline) : undefined;
  const late = deadlineDate !== undefined && finish > deadlineDate;
  const perDay = Math.round(minutes / 5);

  if (late && deadlineDate) {
    const weeksLeft = Math.max(1, Math.floor((deadlineDate.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000)));
    // Afgerond op een kwartier, zodat het een haalbaar getal is.
    const needed = Math.ceil((hours * 60) / weeksLeft / 15) * 15;
    return (
      <Alert variant="warning" icon={<CalendarClock />} title={`Je rondt ${title} af rond ${formatDate(finish.toISOString())}`}>
        Dat is na je deadline van {formatDate(deadline!)}. Met {formatMinutes(needed)} per week haal je hem wel.
      </Alert>
    );
  }

  return (
    <Alert variant="success" icon={<CalendarCheck />} title={`Je rondt ${title} af rond ${formatDate(finish.toISOString())}`}>
      Dat is ongeveer {perDay} minuten per werkdag
      {deadline ? `, op tijd voor je deadline van ${formatDate(deadline)}.` : "."}
    </Alert>
  );
}
