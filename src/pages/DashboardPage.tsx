import { useMemo, useState } from "react";
import { BodyMap } from "../components/BodyMap/BodyMap";
import { SkillCard } from "../components/SkillCard/SkillCard";
import { deriveSkillState } from "../domain/deriveSkillState";
import { useI18n } from "../i18n/I18nContext";
import { useAppStore } from "../store/AppStore";
import { ZONE_IDS, type BodyMetric, type ZoneId } from "../types";
import { getZoneTrainingMeasurementCorrelation, metricMeasurementChangePercent, metricMeasurementProgressPercent, zoneMeasurementColor } from "../utils/bodyZoneMath";

function metricChangePercent(metric: BodyMetric, measurements: ReturnType<typeof useAppStore>["bodyMeasurements"]) {
  return metricMeasurementChangePercent(metric, measurements);
}

export function DashboardPage({ goTo }: { goTo: (page: "log" | "skills", entryType?: "training" | "test") => void }) {
  const { skills, entries, bodyMetrics, bodyMeasurements } = useAppStore();
  const { dataLabel, t, zoneName } = useI18n();
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(null);
  const [mapMode, setMapMode] = useState<"training" | "measurements">("training");
  const states = useMemo(() => skills.map((skill) => deriveSkillState(skill, entries)), [skills, entries]);
  const filteredSkills = selectedZone ? skills.filter((skill) => skill.zoneBindings.some((binding) => binding.zoneId === selectedZone)) : skills;
  const filteredMetrics = selectedZone ? bodyMetrics.filter((metric) => (metric.zoneBindings ?? []).some((binding) => binding.zoneId === selectedZone)) : bodyMetrics;
  const correlations = ZONE_IDS.map((zoneId) => ({ zoneId, ...getZoneTrainingMeasurementCorrelation(zoneId, skills, entries, bodyMetrics, bodyMeasurements) })).filter((item) => item.sampleCount > 0);

  return (
    <main className="page dashboard">
      <section className="hero">
        <div><span className="eyebrow">{t("dashboard.eyebrow")}</span><h1>{t("dashboard.title")}</h1><p>{t("dashboard.description")}</p></div>
        <div className="actions"><button onClick={() => goTo("log", "training")}>{t("dashboard.addTraining")}</button><button onClick={() => goTo("log", "test")}>{t("dashboard.addTest")}</button><button className="secondary" onClick={() => goTo("skills")}>{t("dashboard.manageSkills")}</button></div>
      </section>

      <section className="dashboard-grid">
        <BodyMap skills={skills} states={states} metrics={bodyMetrics} measurements={bodyMeasurements} mode={mapMode} onModeChange={setMapMode} selectedZone={selectedZone} onSelectZone={setSelectedZone} />
        <div className="panel">
          <div className="panel-heading"><div><span className="eyebrow">{selectedZone ? t("dashboard.filteredZone") : mapMode === "training" ? t("dashboard.allSkills") : t("dashboard.allMeasurements")}</span><h2>{selectedZone ? zoneName(selectedZone) : mapMode === "training" ? t("dashboard.skillOverview") : t("dashboard.measurementOverview")}</h2></div>{selectedZone && <button className="ghost" onClick={() => setSelectedZone(null)}>{t("dashboard.clear")}</button>}</div>
          <div className="skill-list">
            {mapMode === "training" ? filteredSkills.map((skill) => <SkillCard key={skill.id} skill={skill} state={states.find((state) => state.skillId === skill.id)!} />) : filteredMetrics.map((metric) => {
              const changePercent = metricChangePercent(metric, bodyMeasurements);
              const progressPercent = metricMeasurementProgressPercent(metric, bodyMeasurements);
              return <article className="measurement-dashboard-card" key={metric.id}><strong>{dataLabel(metric.name)}</strong><span style={{ color: zoneMeasurementColor(progressPercent) }}>{changePercent === null ? t("measurements.noData") : `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%`}</span><small>{t(`measurements.${metric.betterDirection}`)}</small></article>;
            })}
          </div>
        </div>
      </section>

      <section className="panel correlation-panel">
        <div className="panel-heading"><div><span className="eyebrow">{t("dashboard.correlationEyebrow")}</span><h2>{t("dashboard.correlationTitle")}</h2></div></div>
        <p>{t("dashboard.correlationDescription")}</p>
        <div className="correlation-grid">
          {correlations.map((item) => <article key={item.zoneId}><strong>{zoneName(item.zoneId)}</strong><span>{item.coefficient === null ? "—" : item.coefficient.toFixed(2)}</span><small>{item.sampleCount} {t("dashboard.matchedMonths")} · {item.coefficient === null ? t("dashboard.insufficientData") : Math.abs(item.coefficient) >= .7 ? t("dashboard.strongCorrelation") : Math.abs(item.coefficient) >= .4 ? t("dashboard.mediumCorrelation") : t("dashboard.weakCorrelation")}</small></article>)}
          {!correlations.length && <p>{t("dashboard.insufficientData")}</p>}
        </div>
        <small className="correlation-warning">{t("dashboard.correlationWarning")}</small>
      </section>
    </main>
  );
}
