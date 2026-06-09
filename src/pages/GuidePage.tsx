import {
  AnalyticsIllustration,
  DashboardIllustration,
  EntryIllustration,
  SkillsIllustration,
} from "../components/GuideIllustrations/GuideIllustrations";
import { useI18n } from "../i18n/I18nContext";

export function GuidePage() {
  const { t } = useI18n();

  return (
    <main className="page guide-page">
      <section className="guide-hero">
        <span className="eyebrow">{t("guide.eyebrow")}</span>
        <h1>{t("guide.title")}</h1>
        <p>{t("guide.description")}</p>
        <div className="guide-principle">
          <strong>{t("guide.principleTitle")}</strong>
          <span>{t("guide.principle")}</span>
        </div>
      </section>

      <nav className="guide-toc panel" aria-label={t("guide.contents")}>
        <strong>{t("guide.contents")}</strong>
        <a href="#dashboard-guide">1. {t("guide.dashboardTitle")}</a>
        <a href="#statuses-guide">2. {t("guide.statusesTitle")}</a>
        <a href="#entry-guide">3. {t("guide.entryTitle")}</a>
        <a href="#skills-guide">4. {t("guide.skillsTitle")}</a>
        <a href="#measurements-guide">5. {t("guide.measurementsTitle")}</a>
        <a href="#analytics-guide">6. {t("guide.analyticsTitle")}</a>
        <a href="#workflow-guide">7. {t("guide.workflowTitle")}</a>
      </nav>

      <section id="dashboard-guide" className="guide-section">
        <div className="guide-copy">
          <span className="guide-step">01</span>
          <h2>{t("guide.dashboardTitle")}</h2>
          <p>{t("guide.dashboardText")}</p>
          <ul>
            <li>{t("guide.dashboardBullet1")}</li>
            <li>{t("guide.dashboardBullet2")}</li>
            <li>{t("guide.dashboardBullet3")}</li>
          </ul>
          <div className="guide-example"><strong>{t("guide.example")}</strong>{t("guide.dashboardExample")}</div>
        </div>
        <DashboardIllustration labels={[t("guide.dashboardImage"), t("guide.bodyMap"), t("guide.skillCards")]} />
      </section>

      <section id="statuses-guide" className="guide-reference panel">
        <span className="guide-step">02</span>
        <h2>{t("guide.statusesTitle")}</h2>
        <p>{t("guide.statusesText")}</p>
        <div className="guide-status-grid">
          <article>
            <span className="status stable">{t("status.stable")}</span>
            <strong>{t("guide.stableMeaning")}</strong>
            <p>{t("guide.stableDetails")}</p>
          </article>
          <article>
            <span className="status decaying">{t("status.decaying")}</span>
            <strong>{t("guide.decayingMeaning")}</strong>
            <p>{t("guide.decayingDetails")}</p>
          </article>
          <article>
            <span className="status stale">{t("status.stale")}</span>
            <strong>{t("guide.staleMeaning")}</strong>
            <p>{t("guide.staleDetails")}</p>
          </article>
        </div>
        <div className="guide-formula">
          <strong>{t("guide.decayFormulaTitle")}</strong>
          <code>currentValue = peakValue × 0.5 ^ ((daysInactive - graceDays) / halfLifeDays)</code>
          <span>{t("guide.decayFormulaText")}</span>
        </div>
        <div className="guide-metric-grid">
          <article><strong>{t("skill.current")}</strong><span>{t("guide.currentMeaning")}</span></article>
          <article><strong>{t("skill.latestTest")}</strong><span>{t("guide.latestTestMeaning")}</span></article>
          <article><strong>{t("skill.peak")}</strong><span>{t("guide.peakMeaning")}</span></article>
          <article><strong>{t("analytics.currentLevel")}</strong><span>{t("guide.currentLevelMeaning")}</span></article>
        </div>
      </section>

      <section id="entry-guide" className="guide-section reverse">
        <div className="guide-copy">
          <span className="guide-step">03</span>
          <h2>{t("guide.entryTitle")}</h2>
          <p>{t("guide.entryText")}</p>
          <div className="guide-compare">
            <article><strong>{t("log.training")}</strong><span>{t("guide.trainingExplanation")}</span></article>
            <article><strong>{t("log.test")}</strong><span>{t("guide.testExplanation")}</span></article>
          </div>
          <div className="guide-example"><strong>{t("log.sets")}: </strong>{t("guide.setsExplanation")}</div>
          <div className="guide-example"><strong>{t("meditation.title")}: </strong>{t("guide.meditationExplanation")}</div>
          <div className="guide-example"><strong>{t("guide.example")}</strong>{t("guide.meditationExample")}</div>
          <div className="guide-example"><strong>{t("guide.example")}</strong>{t("guide.entryExample")}</div>
        </div>
        <EntryIllustration labels={[t("guide.entryImage"), t("log.entryType"), t("log.skill"), t("log.trainingStrength"), t("log.save")]} />
      </section>

      <section id="skills-guide" className="guide-section">
        <div className="guide-copy">
          <span className="guide-step">04</span>
          <h2>{t("guide.skillsTitle")}</h2>
          <p>{t("guide.skillsText")}</p>
          <ul>
            <li>{t("guide.skillsBullet1")}</li>
            <li>{t("guide.skillsBullet2")}</li>
            <li>{t("guide.skillsBullet3")}</li>
          </ul>
          <div className="guide-example"><strong>{t("guide.example")}</strong>{t("guide.skillsExample")}</div>
        </div>
        <SkillsIllustration labels={[t("guide.skillsImage"), t("skills.bodyZones"), t("guide.chest"), t("guide.arms"), t("guide.abdomen"), t("guide.pelvis")]} />
      </section>

      <section className="guide-fields panel">
        <h2>{t("guide.fieldsTitle")}</h2>
        <p>{t("guide.fieldsIntro")}</p>
        <div className="guide-field-list">
          {[
            ["skills.name", "guide.fieldName"],
            ["skills.category", "guide.fieldCategory"],
            ["skills.metric", "guide.fieldMetric"],
            ["skills.unit", "guide.fieldUnit"],
            ["skills.trainingMode", "guide.fieldTrainingMode"],
            ["skills.graceDays", "guide.fieldGrace"],
            ["skills.halfLifeDays", "guide.fieldHalfLife"],
            ["skills.levels", "guide.fieldLevels"],
            ["skills.bodyZones", "guide.fieldZones"],
            ["skills.notes", "guide.fieldNotes"],
          ].map(([label, description]) => (
            <article key={label}>
              <strong>{t(label as Parameters<typeof t>[0])}</strong>
              <span>{t(description as Parameters<typeof t>[0])}</span>
            </article>
          ))}
        </div>
        <div className="guide-filled-example">
          <div>
            <span className="eyebrow">{t("guide.filledExample")}</span>
            <h3>{t("guide.pullupsExampleTitle")}</h3>
            <p>{t("guide.pullupsExampleText")}</p>
          </div>
          <dl>
            <div><dt>{t("skills.name")}</dt><dd>{t("guide.pullupsName")}</dd></div>
            <div><dt>{t("skills.category")}</dt><dd>{t("category.physical")}</dd></div>
            <div><dt>{t("skills.metric")}</dt><dd>{t("guide.pullupsMetric")}</dd></div>
            <div><dt>{t("skills.unit")}</dt><dd>{t("guide.pullupsUnit")}</dd></div>
            <div><dt>{t("skills.graceDays")}</dt><dd>7</dd></div>
            <div><dt>{t("skills.halfLifeDays")}</dt><dd>30</dd></div>
            <div><dt>{t("skills.levels")}</dt><dd><code>0:0, 1:1, 2:3, 3:5, 4:8, 5:10</code></dd></div>
            <div><dt>{t("skills.bodyZones")}</dt><dd>{t("guide.pullupsZones")}</dd></div>
          </dl>
        </div>
      </section>

      <section id="measurements-guide" className="guide-reference panel">
        <span className="guide-step">05</span>
        <h2>{t("guide.measurementsTitle")}</h2>
        <p>{t("guide.measurementsText")}</p>
        <ul>
          <li>{t("guide.measurementsBullet1")}</li>
          <li>{t("guide.measurementsBullet2")}</li>
          <li>{t("guide.measurementsBullet3")}</li>
          <li>{t("guide.measurementsBullet4")}</li>
        </ul>
        <div className="guide-example"><strong>{t("guide.example")}</strong>{t("guide.measurementsExample")}</div>
      </section>

      <section id="analytics-guide" className="guide-section reverse">
        <div className="guide-copy">
          <span className="guide-step">06</span>
          <h2>{t("guide.analyticsTitle")}</h2>
          <p>{t("guide.analyticsText")}</p>
          <ul>
            <li>{t("guide.analyticsBullet1")}</li>
            <li>{t("guide.analyticsBullet2")}</li>
            <li>{t("guide.analyticsBullet3")}</li>
          </ul>
          <div className="guide-example"><strong>{t("guide.example")}</strong>{t("guide.analyticsExample")}</div>
        </div>
        <AnalyticsIllustration labels={[t("guide.analyticsImage"), t("analytics.trainingStrength"), t("analytics.currentValue"), t("analytics.testValue")]} />
      </section>

      <section id="workflow-guide" className="guide-workflow panel">
        <span className="guide-step">07</span>
        <h2>{t("guide.workflowTitle")}</h2>
        <p>{t("guide.workflowText")}</p>
        <ol>
          <li><strong>{t("guide.workflow1Title")}</strong><span>{t("guide.workflow1Text")}</span></li>
          <li><strong>{t("guide.workflow2Title")}</strong><span>{t("guide.workflow2Text")}</span></li>
          <li><strong>{t("guide.workflow3Title")}</strong><span>{t("guide.workflow3Text")}</span></li>
          <li><strong>{t("guide.workflow4Title")}</strong><span>{t("guide.workflow4Text")}</span></li>
        </ol>
      </section>
    </main>
  );
}
