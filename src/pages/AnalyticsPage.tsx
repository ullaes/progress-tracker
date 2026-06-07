import { useMemo, useState } from "react";
import { ProgressChart } from "../components/ProgressChart/ProgressChart";
import { buildSkillHistory, historyWindowStart, type HistoryGranularity } from "../domain/history";
import { useI18n } from "../i18n/I18nContext";
import { useAppStore } from "../store/AppStore";
import { formatDateTime } from "../utils/date";
import { entryDateTime, trainingReps, trainingVolume } from "../utils/trainingMath";

export function AnalyticsPage() {
  const { entries, skills } = useAppStore();
  const { dataLabel, locale, t } = useI18n();
  const [skillId, setSkillId] = useState(skills[0]?.id ?? "");
  const [granularity, setGranularity] = useState<HistoryGranularity>("day");
  const skill = skills.find((item) => item.id === skillId) ?? skills[0];
  const points = useMemo(
    () => skill ? buildSkillHistory(skill, entries, granularity) : [],
    [entries, granularity, skill],
  );
  const windowEntries = useMemo(
    () => entries
      .filter((entry) => entry.skillId === skill?.id && entry.date >= historyWindowStart(points))
      .sort((a, b) => entryDateTime(b).localeCompare(entryDateTime(a))),
    [entries, points, skill?.id],
  );
  const trainings = windowEntries.filter((entry) => entry.type === "training");
  const intensities = trainings
    .map((entry) => entry.trainingIntensity)
    .filter((value): value is number => value !== undefined);
  const lastPoint = points.at(-1);
  const totalTrainingVolume = trainings.reduce((sum, entry) => sum + trainingVolume(entry), 0);
  const hasWeightedSets = trainings.some((entry) => entry.sets?.some((set) => set.value !== undefined));
  const trainingDetails = (entry: (typeof entries)[number]) => {
    const strength = entry.trainingIntensity === undefined ? "—" : `${entry.trainingIntensity} / 10`;
    const setDetails = entry.sets?.map((set) => `${set.value === undefined ? "" : `${set.value} ${dataLabel(skill.unit)} × `}${set.reps}`).join("; ");
    return setDetails
      ? `${setDetails} · ${t("log.totalReps")} ${trainingReps(entry)} · ${t("analytics.trainingVolume")} ${trainingVolume(entry).toFixed(1)} · ${strength}`
      : strength;
  };

  if (!skill) {
    return <main className="page"><p>{t("analytics.noSkills")}</p></main>;
  }

  return (
    <main className="page analytics-page">
      <section className="hero analytics-hero">
        <div>
          <span className="eyebrow">{t("analytics.eyebrow")}</span>
          <h1>{t("analytics.title")}</h1>
          <p>{t("analytics.description")}</p>
        </div>
        <div className="analytics-controls">
          <label>
            {t("analytics.skill")}
            <select value={skill.id} onChange={(event) => setSkillId(event.target.value)}>
              {skills.map((item) => <option key={item.id} value={item.id}>{dataLabel(item.name)}</option>)}
            </select>
          </label>
          <div className="period-switch" aria-label={t("analytics.period")}>
            {(["day", "month", "year"] as const).map((period) => (
              <button
                key={period}
                className={granularity === period ? "active" : "secondary"}
                onClick={() => setGranularity(period)}
              >
                {t(`analytics.${period}`)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="analytics-summary">
        <article className="summary-card">
          <span>{t("analytics.currentValue")}</span>
          <strong>{lastPoint?.currentValue === null || lastPoint?.currentValue === undefined ? "—" : `${lastPoint.currentValue.toFixed(1)} ${dataLabel(skill.unit)}`}</strong>
          <small>{t("analytics.currentLevel")} {lastPoint?.currentLevel?.toFixed(1) ?? "—"}</small>
        </article>
        <article className="summary-card">
          <span>{t("analytics.trainings")}</span>
          <strong>{trainings.length}</strong>
          <small>{t("analytics.selectedPeriod")}</small>
        </article>
        <article className="summary-card">
          <span>{t("analytics.trainingVolume")}</span>
          <strong>{totalTrainingVolume.toFixed(1)} {hasWeightedSets ? `${dataLabel(skill.unit)}×${t("log.repsShort")}` : t("log.repsShort")}</strong>
          <small>{t("analytics.averageStrength")} {intensities.length ? `${(intensities.reduce((sum, value) => sum + value, 0) / intensities.length).toFixed(1)} / 10` : "—"}</small>
        </article>
        <article className="summary-card">
          <span>{t("analytics.tests")}</span>
          <strong>{windowEntries.filter((entry) => entry.type === "test").length}</strong>
          <small>{dataLabel(skill.metricName)}</small>
        </article>
      </section>

      <section className="panel chart-panel">
        <div className="chart-heading">
          <div>
            <span className="eyebrow">{dataLabel(skill.metricName)}</span>
            <h2>{dataLabel(skill.name)}</h2>
          </div>
          <div className="chart-legend">
            <span className="legend-line">{t("analytics.currentValue")}</span>
            <span className="legend-dot">{t("analytics.testValue")}</span>
            <span className="legend-bar">{t("analytics.trainingVolume")}</span>
          </div>
        </div>
        <ProgressChart points={points} skill={skill} granularity={granularity} />
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">{t("analytics.events")}</span>
            <h2>{t("analytics.trainingAndTests")}</h2>
          </div>
        </div>
        <div className="event-table-wrap">
          <table className="event-table">
            <thead>
              <tr>
                <th>{t("log.date")}</th>
                <th>{t("log.entryType")}</th>
                <th>{t("analytics.valueOrStrength")}</th>
                <th>{t("log.notes")}</th>
              </tr>
            </thead>
            <tbody>
              {windowEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDateTime(entry.date, entry.time, locale)}</td>
                  <td>{entry.type === "training" ? t("log.training") : t("log.test")}</td>
                  <td>
                    {entry.type === "training"
                      ? trainingDetails(entry)
                      : `${entry.value?.toFixed(1) ?? "—"} ${dataLabel(skill.unit)}`}
                  </td>
                  <td>{entry.notes ? dataLabel(entry.notes) : "—"}</td>
                </tr>
              ))}
              {!windowEntries.length && <tr><td colSpan={4}>{t("analytics.noEvents")}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
