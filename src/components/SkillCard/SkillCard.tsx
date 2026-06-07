import type { DerivedSkillState, Skill } from "../../types";
import { useI18n } from "../../i18n/I18nContext";
import { formatDate } from "../../utils/date";

export function SkillCard({ skill, state }: { skill: Skill; state: DerivedSkillState }) {
  const { categoryName, dataLabel, locale, statusName, t } = useI18n();
  const value = (number: number | null) => (number === null ? "—" : `${number.toFixed(1)} ${dataLabel(skill.unit)}`);
  const level = (number: number | null) => (number === null ? "—" : number.toFixed(1));

  return (
    <article className="skill-card">
      <div className="skill-card-heading">
        <div>
          <span className="eyebrow">{categoryName(skill.category)} · {dataLabel(skill.metricName)}</span>
          <h3>{dataLabel(skill.name)}</h3>
        </div>
        <span className={`status ${state.decayStatus}`}>{statusName(state.decayStatus)}</span>
      </div>
      <div className="level-line">
        <strong>{t("skill.level")} {level(state.currentLevel)}</strong>
        <span>{t("skill.peak")} {level(state.peakLevel)}</span>
      </div>
      <div className="level-track"><span style={{ width: `${Math.min(100, (state.currentLevel ?? 0) * 10)}%` }} /></div>
      <dl className="skill-stats">
        <div><dt>{t("skill.current")}</dt><dd>{value(state.currentValue)}</dd></div>
        <div><dt>{t("skill.latestTest")}</dt><dd>{value(state.latestTestValue)}</dd></div>
        <div><dt>{t("skill.peak")}</dt><dd>{value(state.peakValue)}</dd></div>
        <div><dt>{t("skill.lastActivity")}</dt><dd>{state.lastActivityDate ? formatDate(state.lastActivityDate, locale) : t("skill.never")}</dd></div>
      </dl>
    </article>
  );
}
