import { useMemo, useState } from "react";
import { BodyMap } from "../components/BodyMap/BodyMap";
import { SkillCard } from "../components/SkillCard/SkillCard";
import { deriveSkillState } from "../domain/deriveSkillState";
import { useI18n } from "../i18n/I18nContext";
import { useAppStore } from "../store/AppStore";
import type { ZoneId } from "../types";

export function DashboardPage({ goTo }: { goTo: (page: "log" | "skills", entryType?: "training" | "test") => void }) {
  const { skills, entries, resetDemo } = useAppStore();
  const { t, zoneName } = useI18n();
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(null);
  const states = useMemo(() => skills.map((skill) => deriveSkillState(skill, entries)), [skills, entries]);
  const filteredSkills = selectedZone
    ? skills.filter((skill) => skill.zoneBindings.some((binding) => binding.zoneId === selectedZone))
    : skills;

  return (
    <main className="page dashboard">
      <section className="hero">
        <div>
          <span className="eyebrow">{t("dashboard.eyebrow")}</span>
          <h1>{t("dashboard.title")}</h1>
          <p>{t("dashboard.description")}</p>
        </div>
        <div className="actions">
          <button onClick={() => goTo("log", "training")}>{t("dashboard.addTraining")}</button>
          <button onClick={() => goTo("log", "test")}>{t("dashboard.addTest")}</button>
          <button className="secondary" onClick={() => goTo("skills")}>{t("dashboard.manageSkills")}</button>
        </div>
      </section>

      <section className="dashboard-grid">
        <BodyMap skills={skills} states={states} selectedZone={selectedZone} onSelectZone={setSelectedZone} />
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{selectedZone ? t("dashboard.filteredZone") : t("dashboard.allSkills")}</span>
              <h2>{selectedZone ? zoneName(selectedZone) : t("dashboard.skillOverview")}</h2>
            </div>
            {selectedZone && <button className="ghost" onClick={() => setSelectedZone(null)}>{t("dashboard.clear")}</button>}
          </div>
          <div className="skill-list">
            {filteredSkills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} state={states.find((state) => state.skillId === skill.id)!} />
            ))}
          </div>
          <button className="ghost wide" onClick={resetDemo}>{t("dashboard.reset")}</button>
        </div>
      </section>
    </main>
  );
}
