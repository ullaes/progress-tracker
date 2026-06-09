import { useState } from "react";
import { useI18n } from "../../i18n/I18nContext";
import type { BodyMeasurement, BodyMetric, DerivedSkillState, Skill, ZoneId } from "../../types";
import { getZoneMeasurementProgress, zoneMeasurementColor } from "../../utils/bodyZoneMath";
import { getZoneHealth, getZoneLevel, zoneHealthColor } from "../../utils/zoneMath";

const paths: Record<ZoneId, string> = {
  head: "M120 12 C87 12 78 32 80 63 C81 88 96 102 120 102 C144 102 159 88 160 63 C162 32 153 12 120 12 Z",
  chest: "M80 112 C92 104 104 106 120 106 C136 106 148 104 160 112 L171 166 C160 180 145 183 120 181 C95 183 80 180 69 166 Z",
  abdomen: "M70 170 C88 183 152 183 170 170 L168 244 C145 252 95 252 72 244 Z",
  pelvis: "M72 247 C93 254 147 254 168 247 L170 290 C151 292 137 301 120 315 C103 301 89 292 70 290 Z",
  leftUpperArm: "M65 112 C44 116 36 133 35 165 L67 157 L76 115 Z",
  leftForearm: "M35 168 L66 160 L61 222 L47 267 L27 259 L29 207 Z",
  leftHand: "M26 261 L48 269 L47 296 L34 304 L30 326 L24 326 L25 302 L20 326 L15 324 L18 299 L12 320 L7 317 L14 291 L7 303 L3 298 L15 272 Z",
  rightUpperArm: "M175 112 C196 116 204 133 205 165 L173 157 L164 115 Z",
  rightForearm: "M205 168 L174 160 L179 222 L193 267 L213 259 L211 207 Z",
  rightHand: "M214 261 L192 269 L193 296 L206 304 L210 326 L216 326 L215 302 L220 326 L225 324 L222 299 L228 320 L233 317 L226 291 L233 303 L237 298 L225 272 Z",
  leftThigh: "M70 293 C89 295 104 304 117 317 L111 400 C95 410 80 407 70 398 Z",
  leftShin: "M70 402 C83 410 97 412 110 402 L108 505 L82 505 Z",
  leftFoot: "M82 508 L108 508 L112 554 C105 564 75 564 68 554 Z",
  rightThigh: "M170 293 C151 295 136 304 123 317 L129 400 C145 410 160 407 170 398 Z",
  rightShin: "M170 402 C157 410 143 412 130 402 L132 505 L158 505 Z",
  rightFoot: "M158 508 L132 508 L128 554 C135 564 165 564 172 554 Z",
};

type Props = {
  skills: Skill[];
  states: DerivedSkillState[];
  metrics: BodyMetric[];
  measurements: BodyMeasurement[];
  mode: "training" | "measurements";
  onModeChange: (mode: "training" | "measurements") => void;
  selectedZone: ZoneId | null;
  onSelectZone: (zoneId: ZoneId | null) => void;
};

export function BodyMap({ skills, states, metrics, measurements, mode, onModeChange, selectedZone, onSelectZone }: Props) {
  const { dataLabel, t, zoneName } = useI18n();
  const [hovered, setHovered] = useState<ZoneId | null>(null);
  const hoverLevel = hovered ? getZoneLevel(hovered, skills, states) : 0;
  const hoverHealth = hovered ? getZoneHealth(hovered, skills, states) : null;
  const hoverMeasurement = hovered ? getZoneMeasurementProgress(hovered, metrics, measurements) : null;
  const relatedSkills = hovered ? skills.filter((skill) => skill.zoneBindings.some((item) => item.zoneId === hovered)) : [];
  const relatedMetrics = hovered ? metrics.filter((metric) => (metric.zoneBindings ?? []).some((item) => item.zoneId === hovered)) : [];

  return (
    <div className="body-map-wrap">
      <div className="body-map-switch period-switch" aria-label={t("body.mode")}>
        <button className={mode === "training" ? "active" : "secondary"} onClick={() => onModeChange("training")}>{t("body.trainingMode")}</button>
        <button className={mode === "measurements" ? "active" : "secondary"} onClick={() => onModeChange("measurements")}>{t("body.measurementMode")}</button>
      </div>
      <svg className="body-map" viewBox="0 0 240 570" aria-label={t("body.aria")}>
        {Object.entries(paths).map(([zoneId, path]) => {
          const id = zoneId as ZoneId;
          const health = getZoneHealth(id, skills, states);
          const measurement = getZoneMeasurementProgress(id, metrics, measurements);
          return <path key={id} d={path} fill={mode === "training" ? zoneHealthColor(health.problemRatio) : zoneMeasurementColor(measurement.progressPercent)} className={selectedZone === id ? "body-zone selected" : "body-zone"} onMouseEnter={() => setHovered(id)} onMouseLeave={() => setHovered(null)} onClick={() => onSelectZone(selectedZone === id ? null : id)} />;
        })}
      </svg>
      {hovered && <div className="zone-tooltip">
        <strong>{zoneName(hovered)}</strong>
        {mode === "training" ? <>
          <span>{t("body.averageLevel")} {hoverLevel.toFixed(1)}</span>
          {hoverHealth && hoverHealth.relatedCount > 0 && <span>{t("body.stableCount")} {hoverHealth.stableCount} / {t("body.decayingCount")} {hoverHealth.decayingCount} / {t("body.staleCount")} {hoverHealth.staleCount}</span>}
          <span>{relatedSkills.length ? relatedSkills.map((skill) => dataLabel(skill.name)).join(", ") : t("body.noSkills")}</span>
        </> : <>
          <span>{t("body.measurementProgress")} {hoverMeasurement?.progressPercent === null ? "—" : `${hoverMeasurement?.progressPercent.toFixed(1)}%`}</span>
          <span>{relatedMetrics.length ? relatedMetrics.map((metric) => dataLabel(metric.name)).join(", ") : t("body.noMeasurements")}</span>
        </>}
      </div>}
      <div className={`body-health-legend ${mode === "measurements" ? "measurement-legend" : ""}`} aria-label={mode === "training" ? t("body.healthLegend") : t("body.measurementLegend")}>
        <span>{mode === "training" ? t("body.healthy") : t("body.regress")}</span><i /><span>{mode === "training" ? t("body.atRisk") : t("body.progress")}</span>
      </div>
      <p className="body-caption">{mode === "training" ? t("body.caption") : t("body.captionMeasurements")}</p>
    </div>
  );
}
