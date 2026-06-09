import { useState } from "react";
import { useI18n, type Language } from "./i18n/I18nContext";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { BodyMeasurementsPage } from "./pages/BodyMeasurementsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GuidePage } from "./pages/GuidePage";
import { LogPage } from "./pages/LogPage";
import { SkillsPage } from "./pages/SkillsPage";

type Page = "dashboard" | "analytics" | "measurements" | "log" | "skills" | "guide";

export function App() {
  const { language, setLanguage, t } = useI18n();
  const [page, setPage] = useState<Page>("dashboard");
  const [entryType, setEntryType] = useState<"training" | "test">("training");

  const goTo = (next: "log" | "skills", type?: "training" | "test") => {
    if (type) setEntryType(type);
    setPage(next);
  };

  return (
    <>
      <nav className="top-nav">
        <button className={page === "dashboard" ? "nav-active" : ""} onClick={() => setPage("dashboard")}>{t("nav.dashboard")}</button>
        <button className={page === "analytics" ? "nav-active" : ""} onClick={() => setPage("analytics")}>{t("nav.analytics")}</button>
        <button className={page === "measurements" ? "nav-active" : ""} onClick={() => setPage("measurements")}>{t("nav.measurements")}</button>
        <button className={page === "log" ? "nav-active" : ""} onClick={() => setPage("log")}>{t("nav.log")}</button>
        <button className={page === "skills" ? "nav-active" : ""} onClick={() => setPage("skills")}>{t("nav.skills")}</button>
        <button className={page === "guide" ? "nav-active" : ""} onClick={() => setPage("guide")}>{t("nav.guide")}</button>
        <label className="language-select">
          <span>{t("nav.language")}</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
            <option value="en">English</option>
            <option value="ru">Русский</option>
          </select>
        </label>
      </nav>
      {page === "dashboard" && <DashboardPage goTo={goTo} />}
      {page === "analytics" && <AnalyticsPage />}
      {page === "measurements" && <BodyMeasurementsPage />}
      {page === "log" && <LogPage initialType={entryType} goDashboard={() => setPage("dashboard")} />}
      {page === "skills" && <SkillsPage goDashboard={() => setPage("dashboard")} />}
      {page === "guide" && <GuidePage />}
    </>
  );
}
