import { useMemo, useState } from "react";
import { useI18n } from "../i18n/I18nContext";
import { useAppStore } from "../store/AppStore";
import type { TrainingSet } from "../types";
import { todayIso } from "../utils/date";
import { setVolume } from "../utils/trainingMath";

type EntryType = "training" | "test";
type EditableSet = { id: string; value: string; reps: string };

const newSet = (): EditableSet => ({ id: crypto.randomUUID(), value: "", reps: "10" });

function currentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function LogPage({
  initialType,
  goDashboard,
}: {
  initialType: EntryType;
  goDashboard: () => void;
}) {
  const { skills, addEntry } = useAppStore();
  const { dataLabel, t } = useI18n();
  const [type, setType] = useState<EntryType>(initialType);
  const [skillId, setSkillId] = useState(skills[0]?.id ?? "");
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState(currentTime());
  const [value, setValue] = useState("");
  const [trainingIntensity, setTrainingIntensity] = useState("5");
  const [sets, setSets] = useState<EditableSet[]>([newSet()]);
  const [notes, setNotes] = useState("");
  const selectedSkill = skills.find((skill) => skill.id === skillId);

  const parsedSets = useMemo<TrainingSet[]>(
    () => sets
      .map((set) => ({
        id: set.id,
        value: set.value.trim() === "" ? undefined : Number(set.value),
        reps: Number(set.reps),
      }))
      .filter((set) => Number.isFinite(set.reps) && set.reps > 0 && (set.value === undefined || Number.isFinite(set.value))),
    [sets],
  );
  const totalReps = parsedSets.reduce((sum, set) => sum + set.reps, 0);
  const totalVolume = parsedSets.reduce((sum, set) => sum + setVolume(set), 0);
  const hasSetValues = parsedSets.some((set) => set.value !== undefined);

  const updateSet = (id: string, field: "value" | "reps", nextValue: string) => {
    setSets((current) => current.map((set) => set.id === id ? { ...set, [field]: nextValue } : set));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSkill) return;
    if (type === "test" && value.trim() === "") return;
    if (type === "training" && !parsedSets.length) return;
    addEntry({
      id: crypto.randomUUID(),
      type,
      skillId,
      date,
      time,
      value: type === "test" ? Number(value) : undefined,
      trainingIntensity: type === "training" ? Number(trainingIntensity) : undefined,
      sets: type === "training" ? parsedSets : undefined,
      unit: selectedSkill.unit,
      notes: notes.trim() || undefined,
    });
    goDashboard();
  };

  return (
    <main className="page narrow">
      <span className="eyebrow">{t("log.eyebrow")}</span>
      <h1>{t("log.title")}</h1>
      <form className="form panel" onSubmit={submit}>
        <label>
          {t("log.entryType")}
          <select value={type} onChange={(event) => setType(event.target.value as EntryType)}>
            <option value="training">{t("log.training")}</option>
            <option value="test">{t("log.test")}</option>
          </select>
        </label>
        <div className="two-cols">
          <label>
            {t("log.date")}
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>
          <label>
            {t("log.time")}
            <input type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
          </label>
        </div>
        <label>
          {t("log.skill")}
          <select value={skillId} onChange={(event) => setSkillId(event.target.value)} required>
            {skills.map((skill) => <option key={skill.id} value={skill.id}>{dataLabel(skill.name)}</option>)}
          </select>
        </label>

        {type === "training" ? (
          <>
            <label>
              {t("log.trainingStrength")}
              <div className="intensity-field">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={trainingIntensity}
                  onChange={(event) => setTrainingIntensity(event.target.value)}
                />
                <strong>{trainingIntensity} / 10</strong>
              </div>
              <small>{t("log.trainingStrengthHint")}</small>
            </label>
            <section className="sets-editor">
              <div className="sets-heading">
                <div>
                  <strong>{t("log.sets")}</strong>
                  <small>{t("log.setsHint")}</small>
                </div>
                <button type="button" className="secondary" onClick={() => setSets((current) => [...current, newSet()])}>
                  {t("log.addSet")}
                </button>
              </div>
              <div className="sets-table">
                <div className="set-row set-labels">
                  <span>#</span>
                  <span>{t("log.setValue")} ({selectedSkill ? dataLabel(selectedSkill.unit) : t("log.unit")})</span>
                  <span>{t("log.reps")}</span>
                  <span />
                </div>
                {sets.map((set, index) => (
                  <div className="set-row" key={set.id}>
                    <strong>{index + 1}</strong>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={set.value}
                      placeholder={t("log.optional")}
                      onChange={(event) => updateSet(set.id, "value", event.target.value)}
                    />
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={set.reps}
                      required
                      onChange={(event) => updateSet(set.id, "reps", event.target.value)}
                    />
                    <button
                      type="button"
                      className="ghost set-remove"
                      disabled={sets.length === 1}
                      onClick={() => setSets((current) => current.filter((item) => item.id !== set.id))}
                      aria-label={t("log.removeSet")}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="session-totals">
                <span>{t("log.totalSets")} <strong>{parsedSets.length}</strong></span>
                <span>{t("log.totalReps")} <strong>{totalReps}</strong></span>
                <span>{t("log.totalVolume")} <strong>{totalVolume.toFixed(1)} {hasSetValues ? `${dataLabel(selectedSkill?.unit ?? "")}×${t("log.repsShort")}` : t("log.repsShort")}</strong></span>
              </div>
            </section>
          </>
        ) : (
          <label>
            {t("log.measuredValue")}
            <div className="inline-field">
              <input type="number" step="0.1" value={value} required onChange={(event) => setValue(event.target.value)} />
              <span>{selectedSkill ? dataLabel(selectedSkill.unit) : t("log.unit")}</span>
            </div>
          </label>
        )}

        <label>
          {t("log.notes")}
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} />
        </label>
        <div className="form-actions">
          <button type="submit">{t("log.save")}</button>
          <button type="button" className="secondary" onClick={goDashboard}>{t("common.cancel")}</button>
        </div>
      </form>
    </main>
  );
}
