import { useMemo, useState } from "react";
import { useI18n } from "../i18n/I18nContext";
import { useAppStore } from "../store/AppStore";
import type { Entry, TrainingSet } from "../types";
import { todayIso } from "../utils/date";
import { MEDITATION_TYPE_MULTIPLIERS, setVolume } from "../utils/trainingMath";

type EntryType = "training" | "test";
type EditableSet = { id: string; value: string; reps: string };

const newSet = (): EditableSet => ({ id: crypto.randomUUID(), value: "", reps: "10" });

function currentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function LogPage({
  initialType,
  editingEntry,
  onDone,
}: {
  initialType: EntryType;
  editingEntry: Entry | null;
  onDone: () => void;
}) {
  const { skills, addEntry, updateEntry } = useAppStore();
  const { dataLabel, t } = useI18n();
  const [type, setType] = useState<EntryType>(editingEntry?.type ?? initialType);
  const [skillId, setSkillId] = useState(editingEntry?.skillId ?? skills[0]?.id ?? "");
  const [date, setDate] = useState(editingEntry?.date ?? todayIso());
  const [time, setTime] = useState(editingEntry?.time ?? currentTime());
  const [value, setValue] = useState(editingEntry?.value?.toString() ?? "");
  const [trainingIntensity, setTrainingIntensity] = useState(editingEntry?.trainingIntensity?.toString() ?? "5");
  const [meditationType, setMeditationType] = useState<NonNullable<Entry["meditationType"]>>(editingEntry?.meditationType ?? "visual");
  const [meditationQuality, setMeditationQuality] = useState(editingEntry?.meditationQuality?.toString() ?? "7");
  const [meditationDuration, setMeditationDuration] = useState(editingEntry?.meditationDuration?.toString() ?? "10");
  const [sets, setSets] = useState<EditableSet[]>(editingEntry?.sets?.length
    ? editingEntry.sets.map((set) => ({ id: set.id, value: set.value?.toString() ?? "", reps: set.reps.toString() }))
    : editingEntry?.type === "training" && !editingEntry.meditationType
      ? [{ id: crypto.randomUUID(), value: editingEntry.value?.toString() ?? "", reps: "" }]
      : [newSet()]);
  const [notes, setNotes] = useState(editingEntry?.notes ?? "");
  const selectedSkill = skills.find((skill) => skill.id === skillId);
  const isMeditation = selectedSkill?.trainingMode === "meditation";
  const isLegacyTrainingWithoutSets = editingEntry?.type === "training"
    && !editingEntry.sets?.length
    && !editingEntry.meditationType;

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
  const effectiveMeditationMinutes = Number(meditationDuration)
    * (Number(meditationQuality) / 10)
    * MEDITATION_TYPE_MULTIPLIERS[meditationType];

  const updateSet = (id: string, field: "value" | "reps", nextValue: string) => {
    setSets((current) => current.map((set) => set.id === id ? { ...set, [field]: nextValue } : set));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSkill) return;
    if (type === "test" && value.trim() === "") return;
    if (type === "training" && !isMeditation && !parsedSets.length && !isLegacyTrainingWithoutSets) return;
    if (type === "training" && isMeditation && (!Number.isFinite(Number(meditationDuration)) || Number(meditationDuration) <= 0)) return;
    const entry: Entry = {
      id: editingEntry?.id ?? crypto.randomUUID(),
      type,
      skillId,
      date,
      time,
      value: type === "test" ? Number(value) : undefined,
      trainingIntensity: type === "training" ? Number(isMeditation ? meditationQuality : trainingIntensity) : undefined,
      sets: type === "training" && !isMeditation && parsedSets.length ? parsedSets : undefined,
      meditationType: type === "training" && isMeditation ? meditationType : undefined,
      meditationQuality: type === "training" && isMeditation ? Number(meditationQuality) : undefined,
      meditationDuration: type === "training" && isMeditation ? Number(meditationDuration) : undefined,
      unit: selectedSkill.unit,
      notes: notes.trim() || undefined,
    };
    if (editingEntry) updateEntry(entry);
    else addEntry(entry);
    onDone();
  };

  return (
    <main className="page narrow">
      <span className="eyebrow">{editingEntry ? t("log.editEyebrow") : t("log.eyebrow")}</span>
      <h1>{editingEntry ? t("log.editTitle") : t("log.title")}</h1>
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
          isMeditation ? (
            <section className="sets-editor meditation-editor">
              <div className="sets-heading">
                <div>
                  <strong>{t("meditation.title")}</strong>
                  <small>{t("meditation.hint")}</small>
                </div>
              </div>
              <label>
                {t("meditation.type")}
                <select value={meditationType} onChange={(event) => setMeditationType(event.target.value as NonNullable<Entry["meditationType"]>)}>
                  <option value="visual">{t("meditation.visual")}</option>
                  <option value="sound">{t("meditation.sound")}</option>
                  <option value="mentalImage">{t("meditation.mentalImage")}</option>
                  <option value="emptiness">{t("meditation.emptiness")}</option>
                </select>
                <small>{t("meditation.typeHint")}</small>
              </label>
              <label>
                {t("meditation.duration")}
                <div className="inline-field">
                  <input type="number" min="1" step="1" value={meditationDuration} onChange={(event) => setMeditationDuration(event.target.value)} required />
                  <span>{t("meditation.minutes")}</span>
                </div>
              </label>
              <label>
                {t("meditation.quality")}
                <div className="intensity-field">
                  <input type="range" min="1" max="10" value={meditationQuality} onChange={(event) => setMeditationQuality(event.target.value)} />
                  <strong>{meditationQuality} / 10</strong>
                </div>
                <small>{t("meditation.qualityHint")}</small>
              </label>
              <div className="session-totals">
                <span>{t("meditation.effective")}: <strong>{Number.isFinite(effectiveMeditationMinutes) ? effectiveMeditationMinutes.toFixed(1) : "—"} {t("meditation.minutes")}</strong></span>
              </div>
            </section>
          ) : (
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
          )
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
          <button type="submit">{editingEntry ? t("log.saveChanges") : t("log.save")}</button>
          <button type="button" className="secondary" onClick={onDone}>{t("common.cancel")}</button>
        </div>
      </form>
    </main>
  );
}
