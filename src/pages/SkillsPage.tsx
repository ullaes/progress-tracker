import { useMemo, useRef, useState } from "react";
import { useI18n } from "../i18n/I18nContext";
import { useAppStore } from "../store/AppStore";
import type { AppData, Skill, ZoneId } from "../types";
import { ZONE_IDS } from "../types";
import { backupFileName, parseAppDataBackup, serializeAppDataBackup } from "../utils/dataTransfer";

const emptySkill = (): Skill => ({
  id: crypto.randomUUID(),
  name: "",
  category: "physical",
  metricName: "",
  unit: "",
  betterDirection: "higher",
  zoneBindings: [{ zoneId: "head", weight: 1 }],
  graceDays: 7,
  halfLifeDays: 30,
  levels: [
    { level: 0, threshold: 0 },
    { level: 1, threshold: 1 },
    { level: 2, threshold: 3 },
    { level: 3, threshold: 5 },
  ],
});

function serializeLevels(skill: Skill): string {
  return skill.levels.map((item) => `${item.level}:${item.threshold}`).join("\n");
}

function parseLevels(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [level, threshold] = line.split(":").map(Number);
      return { level, threshold };
    })
    .filter((item) => Number.isFinite(item.level) && Number.isFinite(item.threshold))
    .sort((a, b) => a.level - b.level);
}

export function SkillsPage({ goDashboard }: { goDashboard: () => void }) {
  const { entries, version, skills, saveSkill, deleteSkill, importData } = useAppStore();
  const { categoryName, dataLabel, t, zoneName } = useI18n();
  const [editing, setEditing] = useState<Skill>(() => skills[0] ?? emptySkill());
  const [levelsText, setLevelsText] = useState(serializeLevels(editing));
  const [bindingZone, setBindingZone] = useState<ZoneId>("head");
  const [bindingWeight, setBindingWeight] = useState("1");
  const [transferStatus, setTransferStatus] = useState<"imported" | "invalid" | null>(null);
  const importInput = useRef<HTMLInputElement>(null);

  const bindings = useMemo(() => editing.zoneBindings, [editing.zoneBindings]);

  const startEdit = (skill: Skill) => {
    setEditing(skill);
    setLevelsText(serializeLevels(skill));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const levels = parseLevels(levelsText);
    if (!levels.length || !editing.name.trim() || !editing.metricName.trim() || !editing.unit.trim()) return;
    saveSkill({ ...editing, levels, name: editing.name.trim(), metricName: editing.metricName.trim(), unit: editing.unit.trim() });
  };

  const addBinding = () => {
    const weight = Math.min(1, Math.max(0, Number(bindingWeight)));
    setEditing((skill) => ({
      ...skill,
      zoneBindings: [
        ...skill.zoneBindings.filter((item) => item.zoneId !== bindingZone),
        { zoneId: bindingZone, weight },
      ],
    }));
  };

  const removeBinding = (zoneId: ZoneId) => {
    setEditing((skill) => ({ ...skill, zoneBindings: skill.zoneBindings.filter((item) => item.zoneId !== zoneId) }));
  };

  const exportData = () => {
    const blob = new Blob([serializeAppDataBackup({ version, skills, entries })], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = backupFileName();
    link.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    let imported: AppData | null;
    try {
      imported = parseAppDataBackup(await file.text());
    } catch {
      imported = null;
    }
    if (!imported) {
      setTransferStatus("invalid");
      return;
    }
    if (!window.confirm(t("backup.importConfirm"))) return;

    importData(imported);
    const firstSkill = imported.skills[0] ?? emptySkill();
    setEditing(firstSkill);
    setLevelsText(serializeLevels(firstSkill));
    setTransferStatus("imported");
  };

  return (
    <main className="page skills-page">
      <section>
        <span className="eyebrow">{t("skills.eyebrow")}</span>
        <h1>{t("skills.title")}</h1>
        <div className="panel skill-manager-list">
          {skills.map((skill) => (
            <button key={skill.id} className={editing.id === skill.id ? "row-button active" : "row-button"} onClick={() => startEdit(skill)}>
              <span>{dataLabel(skill.name)}</span>
              <small>{categoryName(skill.category)}</small>
            </button>
          ))}
          <button className="secondary wide" onClick={() => { const skill = emptySkill(); setEditing(skill); setLevelsText(serializeLevels(skill)); }}>
            {t("skills.new")}
          </button>
        </div>
        <div className="panel backup-panel">
          <h2>{t("backup.title")}</h2>
          <p>{t("backup.description")}</p>
          <button className="secondary wide" onClick={exportData}>{t("backup.export")}</button>
          <button className="secondary wide" onClick={() => importInput.current?.click()}>{t("backup.import")}</button>
          <input ref={importInput} className="visually-hidden" type="file" accept="application/json,.json" onChange={importBackup} />
          {transferStatus && <small className={transferStatus === "invalid" ? "transfer-status error" : "transfer-status"}>{t(`backup.${transferStatus}`)}</small>}
        </div>
      </section>

      <form className="form panel" onSubmit={submit}>
        <label>{t("skills.name")}<input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} required /></label>
        <label>
          {t("skills.category")}
          <select value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value as Skill["category"] })}>
            <option value="physical">{categoryName("physical")}</option>
            <option value="cognitive">{categoryName("cognitive")}</option>
          </select>
        </label>
        <label>{t("skills.metric")}<input value={editing.metricName} onChange={(event) => setEditing({ ...editing, metricName: event.target.value })} required /></label>
        <label>{t("skills.unit")}<input value={editing.unit} onChange={(event) => setEditing({ ...editing, unit: event.target.value })} required /></label>
        <div className="two-cols">
          <label>{t("skills.graceDays")}<input type="number" min="0" value={editing.graceDays} onChange={(event) => setEditing({ ...editing, graceDays: Number(event.target.value) })} /></label>
          <label>{t("skills.halfLifeDays")}<input type="number" min="1" value={editing.halfLifeDays} onChange={(event) => setEditing({ ...editing, halfLifeDays: Number(event.target.value) })} /></label>
        </div>
        <label>
          {t("skills.levels")}
          <textarea value={levelsText} onChange={(event) => setLevelsText(event.target.value)} rows={6} />
        </label>
        <div className="binding-editor">
          <strong>{t("skills.bodyZones")}</strong>
          <div className="binding-list">
            {bindings.map((binding) => (
              <span key={binding.zoneId} className="binding-chip">
                {zoneName(binding.zoneId)} · {binding.weight}
                <button type="button" onClick={() => removeBinding(binding.zoneId)}>×</button>
              </span>
            ))}
          </div>
          <div className="inline-field">
            <select value={bindingZone} onChange={(event) => setBindingZone(event.target.value as ZoneId)}>
              {ZONE_IDS.map((zone) => <option key={zone} value={zone}>{zoneName(zone)}</option>)}
            </select>
            <input type="number" min="0" max="1" step="0.05" value={bindingWeight} onChange={(event) => setBindingWeight(event.target.value)} />
            <button type="button" onClick={addBinding}>{t("skills.addZone")}</button>
          </div>
        </div>
        <label>{t("skills.notes")}<textarea value={editing.notes ?? ""} onChange={(event) => setEditing({ ...editing, notes: event.target.value })} rows={3} /></label>
        <div className="form-actions">
          <button type="submit">{t("skills.save")}</button>
          <button type="button" className="secondary" onClick={goDashboard}>{t("common.dashboard")}</button>
          {skills.some((skill) => skill.id === editing.id) && (
            <button
              type="button"
              className="danger"
              onClick={() => window.confirm(t("skills.deleteConfirm")) && deleteSkill(editing.id)}
            >
              {t("skills.delete")}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
