import { useI18n } from "../../i18n/I18nContext";
import type { Skill } from "../../types";
import type { HistoryGranularity, HistoryPoint } from "../../domain/history";

const WIDTH = 1000;
const HEIGHT = 430;
const PADDING = { top: 28, right: 52, bottom: 58, left: 64 };

function linePath(points: HistoryPoint[], maxValue: number): string {
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  let started = false;
  return points
    .map((point, index) => {
      if (point.currentValue === null) {
        started = false;
        return "";
      }
      const x = PADDING.left + (index / Math.max(1, points.length - 1)) * plotWidth;
      const y = PADDING.top + plotHeight - (point.currentValue / maxValue) * plotHeight;
      const command = started ? "L" : "M";
      started = true;
      return `${command} ${x} ${y}`;
    })
    .filter(Boolean)
    .join(" ");
}

export function ProgressChart({
  points,
  skill,
  granularity,
  trainingVolumeLabel,
}: {
  points: HistoryPoint[];
  skill: Skill;
  granularity: HistoryGranularity;
  trainingVolumeLabel?: string;
}) {
  const { dataLabel, locale, t } = useI18n();
  const values = points.flatMap((point) => [point.currentValue, point.latestTestValue]).filter((value): value is number => value !== null);
  const maxValue = Math.max(1, ...values) * 1.12;
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const xAt = (index: number) => PADDING.left + (index / Math.max(1, points.length - 1)) * plotWidth;
  const yAt = (value: number) => PADDING.top + plotHeight - (value / maxValue) * plotHeight;
  const dateFormat = granularity === "day"
    ? { month: "short", day: "numeric" } as const
    : granularity === "month"
      ? { month: "short", year: "2-digit" } as const
      : { year: "numeric" } as const;
  const showEvery = Math.max(1, Math.ceil(points.length / 7));
  const maxTrainingVolume = Math.max(1, ...points.map((point) => point.trainingVolume));

  return (
    <div className="chart-scroll">
      <svg className="progress-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={t("analytics.chartAria")}>
        {[0, .25, .5, .75, 1].map((ratio) => {
          const y = PADDING.top + plotHeight - ratio * plotHeight;
          return (
            <g key={ratio}>
              <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} className="chart-grid" />
              <text x={PADDING.left - 10} y={y + 4} textAnchor="end" className="chart-axis-text">
                {(maxValue * ratio).toFixed(1)}
              </text>
              <text x={WIDTH - PADDING.right + 10} y={y + 4} className="chart-axis-text">{(maxTrainingVolume * ratio).toFixed(0)}</text>
            </g>
          );
        })}
        <text x={PADDING.left} y={18} className="chart-axis-text">{dataLabel(skill.unit)}</text>
        <text x={WIDTH - PADDING.right} y={18} textAnchor="end" className="chart-axis-text">{trainingVolumeLabel ?? t("analytics.trainingVolume")}</text>

        {points.map((point, index) => {
          const x = xAt(index);
          const barHeight = (point.trainingVolume / maxTrainingVolume) * plotHeight;
          const label = new Intl.DateTimeFormat(locale, dateFormat).format(new Date(`${point.date}T00:00:00`));
          return (
            <g key={point.date}>
              {point.trainingVolume > 0 && (
                <rect
                  x={x - Math.max(3, plotWidth / points.length / 4)}
                  y={PADDING.top + plotHeight - barHeight}
                  width={Math.max(6, plotWidth / points.length / 2)}
                  height={barHeight}
                  rx="3"
                  className="training-bar"
                >
                  <title>{`${label}: ${trainingVolumeLabel ?? t("analytics.trainingVolume")} ${point.trainingVolume.toFixed(1)}, ${t("analytics.trainings")} ${point.trainingCount}`}</title>
                </rect>
              )}
              {point.latestTestValue !== null && (
                <circle cx={x} cy={yAt(point.latestTestValue)} r="5" className="test-point">
                  <title>{`${label}: ${t("analytics.testValue")} ${point.latestTestValue.toFixed(1)} ${dataLabel(skill.unit)}`}</title>
                </circle>
              )}
              {(index % showEvery === 0 || index === points.length - 1) && (
                <text x={x} y={HEIGHT - 23} textAnchor="middle" className="chart-axis-text">{label}</text>
              )}
            </g>
          );
        })}
        <path d={linePath(points, maxValue)} className="progress-line" />
      </svg>
    </div>
  );
}
