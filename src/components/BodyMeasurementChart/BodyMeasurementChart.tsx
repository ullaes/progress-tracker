import type { BodyMeasurementPoint } from "../../domain/bodyMeasurementHistory";
import type { HistoryGranularity } from "../../domain/history";
import { useI18n } from "../../i18n/I18nContext";
import type { BodyMetric } from "../../types";

const WIDTH = 1000;
const HEIGHT = 390;
const PADDING = { top: 30, right: 40, bottom: 58, left: 70 };

export function BodyMeasurementChart({
  points,
  metric,
  granularity,
}: {
  points: BodyMeasurementPoint[];
  metric: BodyMetric;
  granularity: HistoryGranularity;
}) {
  const { dataLabel, locale, t } = useI18n();
  const values = points.map((point) => point.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const dataRange = values.length > 1 ? Math.max(1, rawMax - rawMin) : Math.max(1, Math.abs(values[0] ?? 0) * .1);
  const minValue = values.length ? Math.min(...values) - dataRange * .15 : 0;
  const maxValue = values.length ? Math.max(...values) + dataRange * .15 : 1;
  const range = Math.max(1, maxValue - minValue);
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const xAt = (index: number) => PADDING.left + (index / Math.max(1, points.length - 1)) * plotWidth;
  const yAt = (value: number) => PADDING.top + plotHeight - ((value - minValue) / range) * plotHeight;
  const dateFormat = granularity === "day"
    ? { month: "short", day: "numeric" } as const
    : granularity === "month"
      ? { month: "short", year: "2-digit" } as const
      : { year: "numeric" } as const;
  const path = points.map((point, index) => `${index ? "L" : "M"} ${xAt(index)} ${yAt(point.value)}`).join(" ");

  return (
    <div className="chart-scroll">
      <svg className="progress-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={t("measurements.chartAria")}>
        {[0, .25, .5, .75, 1].map((ratio) => {
          const y = PADDING.top + plotHeight - ratio * plotHeight;
          return (
            <g key={ratio}>
              <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} className="chart-grid" />
              <text x={PADDING.left - 10} y={y + 4} textAnchor="end" className="chart-axis-text">
                {(minValue + range * ratio).toFixed(1)}
              </text>
            </g>
          );
        })}
        <text x={PADDING.left} y={18} className="chart-axis-text">{dataLabel(metric.unit)}</text>
        {points.map((point, index) => {
          const label = new Intl.DateTimeFormat(locale, dateFormat).format(new Date(`${point.date}T00:00:00`));
          return (
            <g key={`${point.date}-${index}`}>
              <circle cx={xAt(index)} cy={yAt(point.value)} r="5" className="measurement-point">
                <title>{`${label}: ${point.value.toFixed(1)} ${dataLabel(metric.unit)}`}</title>
              </circle>
              <text x={xAt(index)} y={HEIGHT - 23} textAnchor="middle" className="chart-axis-text">{label}</text>
            </g>
          );
        })}
        <path d={path} className="measurement-line" />
        {!points.length && <text x={WIDTH / 2} y={HEIGHT / 2} textAnchor="middle" className="chart-axis-text">{t("measurements.noData")}</text>}
      </svg>
    </div>
  );
}
