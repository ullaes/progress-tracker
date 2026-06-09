import { useMemo, useState } from "react";
import { BodyMeasurementChart } from "../components/BodyMeasurementChart/BodyMeasurementChart";
import { buildBodyMeasurementHistory, bodyMeasurementDateTime } from "../domain/bodyMeasurementHistory";
import type { HistoryGranularity } from "../domain/history";
import { useI18n } from "../i18n/I18nContext";
import { useAppStore } from "../store/AppStore";
import { ZONE_IDS, type BodyMetric, type ZoneId } from "../types";
import { formatDateTime, todayIso } from "../utils/date";

function currentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function BodyMeasurementsPage() {
  const { bodyMetrics, bodyMeasurements, addBodyMetric, saveBodyMetric, addBodyMeasurement, deleteBodyMeasurement } = useAppStore();
  const { dataLabel, locale, t, zoneName } = useI18n();
  const [metricId, setMetricId] = useState(bodyMetrics[0]?.id ?? "");
  const [granularity, setGranularity] = useState<HistoryGranularity>("month");
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState(currentTime());
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("cm");
  const [newDirection, setNewDirection] = useState<BodyMetric["betterDirection"]>("higher");
  const [bindingZone, setBindingZone] = useState<ZoneId>("abdomen");
  const [bindingWeight, setBindingWeight] = useState("1");
  const metric = bodyMetrics.find((item) => item.id === metricId) ?? bodyMetrics[0];
  const metricMeasurements = useMemo(
    () => bodyMeasurements
      .filter((measurement) => measurement.metricId === metric?.id)
      .sort((a, b) => bodyMeasurementDateTime(b).localeCompare(bodyMeasurementDateTime(a))),
    [bodyMeasurements, metric?.id],
  );
  const points = useMemo(
    () => metric ? buildBodyMeasurementHistory(metric.id, bodyMeasurements, granularity) : [],
    [bodyMeasurements, granularity, metric],
  );
  const latest = metricMeasurements[0];
  const earliest = metricMeasurements.at(-1);
  const change = latest && earliest ? latest.value - earliest.value : null;
  const progress = change === null || !metric ? null : change * (metric.betterDirection === "higher" ? 1 : -1);

  const submitMeasurement = (event: React.FormEvent) => {
    event.preventDefault();
    if (!metric || value.trim() === "" || !Number.isFinite(Number(value))) return;
    addBodyMeasurement({
      id: crypto.randomUUID(),
      metricId: metric.id,
      date,
      time,
      value: Number(value),
      notes: notes.trim() || undefined,
    });
    setValue("");
    setNotes("");
  };

  const submitMetric = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newName.trim() || !newUnit.trim()) return;
    const weight = Math.min(1, Math.max(0, Number(bindingWeight)));
    if (!Number.isFinite(weight)) return;
    const created: BodyMetric = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      unit: newUnit.trim(),
      betterDirection: newDirection,
      zoneBindings: [{ zoneId: bindingZone, weight }],
    };
    addBodyMetric(created);
    setMetricId(created.id);
    setNewName("");
  };

  const addBinding = () => {
    const weight = Math.min(1, Math.max(0, Number(bindingWeight)));
    if (!Number.isFinite(weight)) return;
    saveBodyMetric({
      ...metric,
      zoneBindings: [...(metric.zoneBindings ?? []).filter((binding) => binding.zoneId !== bindingZone), { zoneId: bindingZone, weight }],
    });
  };

  const removeBinding = (zoneId: ZoneId) => {
    saveBodyMetric({ ...metric, zoneBindings: (metric.zoneBindings ?? []).filter((binding) => binding.zoneId !== zoneId) });
  };

  if (!metric) return null;

  return (
    <main className="page measurements-page">
      <section className="hero analytics-hero">
        <div>
          <span className="eyebrow">{t("measurements.eyebrow")}</span>
          <h1>{t("measurements.title")}</h1>
          <p>{t("measurements.description")}</p>
        </div>
        <div className="analytics-controls">
          <label>
            {t("measurements.metric")}
            <select value={metric.id} onChange={(event) => setMetricId(event.target.value)}>
              {bodyMetrics.map((item) => <option key={item.id} value={item.id}>{dataLabel(item.name)}</option>)}
            </select>
          </label>
          <div className="period-switch" aria-label={t("analytics.period")}>
            {(["day", "month", "year"] as const).map((period) => (
              <button key={period} className={granularity === period ? "active" : "secondary"} onClick={() => setGranularity(period)}>
                {t(`analytics.${period}`)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="analytics-summary measurements-summary">
        <article className="summary-card"><span>{t("measurements.latest")}</span><strong>{latest ? `${latest.value.toFixed(1)} ${dataLabel(metric.unit)}` : "—"}</strong><small>{latest ? formatDateTime(latest.date, latest.time, locale) : t("measurements.noData")}</small></article>
        <article className="summary-card"><span>{t("measurements.totalChange")}</span><strong>{change === null ? "—" : `${change > 0 ? "+" : ""}${change.toFixed(1)} ${dataLabel(metric.unit)}`}</strong><small>{t(`measurements.${metric.betterDirection}`)}</small></article>
        <article className="summary-card"><span>{t("measurements.progress")}</span><strong className={progress !== null && progress < 0 ? "negative-progress" : "positive-progress"}>{progress === null ? "—" : progress > 0 ? t("measurements.improved") : progress < 0 ? t("measurements.regressed") : t("measurements.unchanged")}</strong><small>{metricMeasurements.length} {t("measurements.records")}</small></article>
      </section>

      <section className="panel chart-panel">
        <div className="chart-heading"><div><span className="eyebrow">{t("measurements.bodyProgress")}</span><h2>{dataLabel(metric.name)}</h2></div></div>
        <BodyMeasurementChart points={points} metric={metric} granularity={granularity} />
      </section>

      <section className="measurements-grid">
        <form className="form panel" onSubmit={submitMeasurement}>
          <h2>{t("measurements.add")}</h2>
          <div className="two-cols">
            <label>{t("log.date")}<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
            <label>{t("log.time")}<input type="time" value={time} onChange={(event) => setTime(event.target.value)} required /></label>
          </div>
          <label>{t("measurements.value")}<div className="inline-field"><input type="number" step="0.1" value={value} onChange={(event) => setValue(event.target.value)} required /><span>{dataLabel(metric.unit)}</span></div></label>
          <label>{t("log.notes")}<textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
          <button type="submit">{t("measurements.save")}</button>
        </form>

        <form className="form panel" onSubmit={submitMetric}>
          <h2>{t("measurements.newMetric")}</h2>
          <label>{t("measurements.name")}<input value={newName} onChange={(event) => setNewName(event.target.value)} required /></label>
          <label>{t("skills.unit")}<input value={newUnit} onChange={(event) => setNewUnit(event.target.value)} required /></label>
          <label>{t("measurements.direction")}<select value={newDirection} onChange={(event) => setNewDirection(event.target.value as BodyMetric["betterDirection"])}><option value="higher">{t("measurements.higher")}</option><option value="lower">{t("measurements.lower")}</option></select></label>
          <button type="submit" className="secondary">{t("measurements.createMetric")}</button>
        </form>
      </section>

      <section className="panel measurement-bindings">
        <div className="panel-heading"><div><span className="eyebrow">{t("measurements.zoneBindings")}</span><h2>{dataLabel(metric.name)}</h2></div></div>
        <p>{t("measurements.zoneBindingsHint")}</p>
        <div className="binding-list">
          {(metric.zoneBindings ?? []).map((binding) => <span key={binding.zoneId} className="binding-chip">{zoneName(binding.zoneId)} · {binding.weight}<button type="button" onClick={() => removeBinding(binding.zoneId)}>×</button></span>)}
        </div>
        <div className="inline-field binding-controls">
          <select value={bindingZone} onChange={(event) => setBindingZone(event.target.value as ZoneId)}>{ZONE_IDS.map((zoneId) => <option key={zoneId} value={zoneId}>{zoneName(zoneId)}</option>)}</select>
          <input type="number" min="0" max="1" step="0.05" value={bindingWeight} onChange={(event) => setBindingWeight(event.target.value)} />
          <button type="button" onClick={addBinding}>{t("skills.addZone")}</button>
        </div>
      </section>

      <section className="panel measurement-history">
        <div className="panel-heading"><div><span className="eyebrow">{t("measurements.history")}</span><h2>{dataLabel(metric.name)}</h2></div></div>
        <div className="event-table-wrap">
          <table className="event-table"><thead><tr><th>{t("log.date")}</th><th>{t("measurements.value")}</th><th>{t("log.notes")}</th><th /></tr></thead>
            <tbody>
              {metricMeasurements.map((measurement) => <tr key={measurement.id}><td>{formatDateTime(measurement.date, measurement.time, locale)}</td><td>{measurement.value.toFixed(1)} {dataLabel(metric.unit)}</td><td>{measurement.notes ?? "—"}</td><td><button className="ghost" onClick={() => window.confirm(t("measurements.deleteConfirm")) && deleteBodyMeasurement(measurement.id)}>{t("measurements.delete")}</button></td></tr>)}
              {!metricMeasurements.length && <tr><td colSpan={4}>{t("measurements.noData")}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
