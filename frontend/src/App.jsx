import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getSimulationData, simulate } from "./api/api.js";

const CATEGORY_LABELS = {
  transport: "Транспорт",
  ecology: "Экология",
  social: "Соцсфера",
  safety: "Безопасность",
  services: "Сервисы",
};

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

const CATEGORY_META = {
  transport: {
    icon: "↗",
    description: "Связность, скорость и безопасность перемещений",
  },
  ecology: {
    icon: "✦",
    description: "Воздух, зелёные зоны и устойчивость городской среды",
  },
  social: {
    icon: "◎",
    description: "Ближе к дому: образование, здоровье и активная жизнь",
  },
  safety: {
    icon: "⌁",
    description: "Безопасные улицы и предсказуемые маршруты",
  },
  services: {
    icon: "▦",
    description: "Надёжная инфраструктура и быстрый городской сервис",
  },
};

function App() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState({});
  const [districtsByInitiative, setDistrictsByInitiative] = useState({});
  const [result, setResult] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [simulationError, setSimulationError] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    setLoadError("");
    try {
      setData(await getSimulationData());
    } catch {
      setLoadError("Не удалось подключиться к серверу симуляции.");
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedInitiatives = useMemo(() => {
    if (!data) return [];
    return data.initiatives.filter((initiative) => selected[initiative.id]);
  }, [data, selected]);

  const usedBudget = selectedInitiatives.reduce(
    (sum, initiative) => sum + initiative.cost,
    0,
  );
  const remainingBudget = data ? data.budget - usedBudget : 0;

  const categoryCounts = useMemo(
    () =>
      selectedInitiatives.reduce((counts, initiative) => {
        counts[initiative.category] = (counts[initiative.category] || 0) + 1;
        return counts;
      }, {}),
    [selectedInitiatives],
  );

  const missingDistricts = selectedInitiatives.filter(
    (initiative) =>
      initiative.type === "district" && !districtsByInitiative[initiative.id],
  );
  const hasCategoryOverflow = Object.values(categoryCounts).some(
    (count) => count > 2,
  );
  const canSimulate =
    selectedInitiatives.length === 5 &&
    remainingBudget >= 0 &&
    !hasCategoryOverflow &&
    missingDistricts.length === 0;

  const warnings = [
    selectedInitiatives.length > 5 && "Выбрано больше 5 решений.",
    remainingBudget < 0 && `Бюджет превышен на ${Math.abs(remainingBudget)} ед.`,
    hasCategoryOverflow &&
      "В одном направлении выбрано больше 2 мер.",
    missingDistricts.length > 0 &&
      `Выберите район для: ${missingDistricts.map((item) => item.id).join(", ")}.`,
  ].filter(Boolean);

  function toggleInitiative(initiative) {
    setSimulationError("");
    setSelected((current) => ({
      ...current,
      [initiative.id]: !current[initiative.id],
    }));
  }

  function updateDistrict(initiativeId, district) {
    setSimulationError("");
    setDistrictsByInitiative((current) => ({ ...current, [initiativeId]: district }));
  }

  async function runSimulation() {
    if (!canSimulate) {
      setSimulationError(warnings[0] || "Проверьте выбранные решения.");
      return;
    }

    const decisions = selectedInitiatives.map((initiative) => ({
      initiative_id: initiative.id,
      district:
        initiative.type === "district"
          ? districtsByInitiative[initiative.id] || null
          : null,
    }));

    setIsSimulating(true);
    setSimulationError("");
    try {
      setResult(await simulate(decisions));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSimulationError(error.message);
    } finally {
      setIsSimulating(false);
    }
  }

  if (isLoadingData) {
    return <StatusScreen title="Аким на 5 часов" message="Загрузка данных…" />;
  }

  if (loadError || !data) {
    return (
      <StatusScreen title="Аким на 5 часов" message={loadError}>
        <button className="button button-primary" type="button" onClick={loadData}>
          Повторить
        </button>
      </StatusScreen>
    );
  }

  if (result) {
    return (
      <ResultScreen
        data={data}
        result={result}
        onEdit={() => {
          setResult(null);
          setSimulationError("");
        }}
      />
    );
  }

  return (
    <main className="page">
      <nav className="topbar" aria-label="Навигация приложения">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><i /> <i /> <i /></span>
          <span>ASTANA <b>LAB</b></span>
        </div>
        <div className="topbar-status">
          <span className="live-dot" aria-hidden="true" />
          Режим симуляции
          <span className="time-badge">5 часов</span>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Городской симулятор · Стратегическая сессия</p>
          <h1>Аким на <em>5 часов</em></h1>
          <p className="subtitle">
            Соберите пакет из пяти решений и найдите баланс между быстрым эффектом,
            бюджетом и качеством жизни в каждом районе.
          </p>
          <div className="hero-note">
            <span aria-hidden="true">✦</span>
            <p>Меры с пометкой «район» требуют точки приложения.</p>
          </div>
        </div>
        <aside className="mission-card" aria-label="Прогресс сценария">
          <div className="mission-card-top">
            <span>Ваш сценарий</span>
            <span className="step-badge">01 / 02</span>
          </div>
          <div className="decision-count">
            <strong>{String(selectedInitiatives.length).padStart(2, "0")}</strong>
            <span>из 5 решений</span>
          </div>
          <div className="selection-dots" aria-hidden="true">
            {Array.from({ length: 5 }, (_, index) => (
              <i className={index < selectedInitiatives.length ? "is-active" : ""} key={index} />
            ))}
          </div>
          <p>{selectedInitiatives.length === 5 ? "Набор готов к проверке" : "Выберите меры для сценария"}</p>
        </aside>
      </header>

      <section className="budget-dashboard" aria-label="Бюджет сценария">
        <div className="budget-intro">
          <span className="section-kicker">Бюджет сценария</span>
          <strong>{usedBudget}<small> / {data.budget} ед.</small></strong>
          <div className="budget-progress" aria-label={`Использовано ${usedBudget} из ${data.budget} единиц`}>
            <span style={{ width: `${Math.min((usedBudget / data.budget) * 100, 100)}%` }} />
          </div>
        </div>
        <Metric label="Доступно" value={remainingBudget} suffix="ед." tone={remainingBudget < 0 ? "danger" : "accent"} />
        <Metric label="В портфеле" value={selectedInitiatives.length} suffix="решений" />
        <div className="budget-hint">
          <span className="hint-icon" aria-hidden="true">i</span>
          <p>Не более 2 мер в одном направлении.</p>
        </div>
      </section>

      {warnings.length > 0 && (
        <div className="notice" role="status">
          {warnings.map((warning) => <p key={warning}>{warning}</p>)}
        </div>
      )}

      <div className="category-list">
        <div className="portfolio-heading">
          <div>
            <span className="section-kicker">Конструктор решений</span>
            <h2>Соберите городской портфель</h2>
          </div>
          <p>Каждая мера влияет на показатели через заданный лаг.</p>
        </div>
        {CATEGORY_ORDER.map((category, categoryIndex) => {
          const initiatives = data.initiatives.filter(
            (initiative) => initiative.category === category,
          );
          if (initiatives.length === 0) return null;

          return (
            <section className="category-section" key={category}>
              <div className="section-heading">
                <div className="category-heading-copy">
                  <span className={`category-icon ${category}`} aria-hidden="true">{CATEGORY_META[category].icon}</span>
                  <div>
                    <span className="section-kicker">Направление {String(categoryIndex + 1).padStart(2, "0")}</span>
                    <h2>{CATEGORY_LABELS[category]}</h2>
                    <p>{CATEGORY_META[category].description}</p>
                  </div>
                </div>
                <span className={`category-count ${(categoryCounts[category] || 0) > 2 ? "is-over" : ""}`}>
                  {categoryCounts[category] || 0} <i>/ 2</i>
                </span>
              </div>
              <div className="initiative-grid">
                {initiatives.map((initiative) => (
                  <InitiativeCard
                    key={initiative.id}
                    initiative={initiative}
                    districts={Object.keys(data.districts)}
                    isSelected={Boolean(selected[initiative.id])}
                    selectedDistrict={districtsByInitiative[initiative.id] || ""}
                    onToggle={() => toggleInitiative(initiative)}
                    onDistrictChange={(district) => updateDistrict(initiative.id, district)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {simulationError && (
        <div className="simulation-error" role="alert">
          <strong>Сценарий не прошёл проверку</strong>
          <span>{simulationError}</span>
        </div>
      )}

      <footer className="action-bar">
        <div className="action-summary">
          <span className="action-summary-icon" aria-hidden="true">✦</span>
          <div>
            <strong>
              {selectedInitiatives.length === 5
                ? "Портфель готов"
                : selectedInitiatives.length > 5
                  ? "Слишком много решений"
                  : `Нужно выбрать ещё ${5 - selectedInitiatives.length}`}
            </strong>
            <span>{usedBudget} из {data.budget} ед. бюджета</span>
          </div>
        </div>
        <button
          className="button button-primary"
          type="button"
          onClick={runSimulation}
          disabled={!canSimulate || isSimulating}
        >
          {isSimulating ? "Считаем сценарий..." : <>Запустить симуляцию <span aria-hidden="true">→</span></>}
        </button>
      </footer>
    </main>
  );
}

function InitiativeCard({
  initiative,
  districts,
  isSelected,
  selectedDistrict,
  onToggle,
  onDistrictChange,
}) {
  const effectCount = Object.keys(initiative.effects).length;

  return (
    <article className={`initiative-card ${isSelected ? "is-selected" : ""}`}>
      <label className="initiative-choice">
        <input type="checkbox" checked={isSelected} onChange={onToggle} />
        <span className="checkmark" aria-hidden="true"><i>✓</i></span>
        <span className="initiative-copy">
          <span className="initiative-meta">
            <strong>#{initiative.id}</strong>
            <span className={initiative.type === "district" ? "scope-district" : "scope-city"}>
              {initiative.type === "district" ? "Район" : "Весь город"}
            </span>
          </span>
          <span className="initiative-name">{initiative.name}</span>
        </span>
      </label>

      <div className="initiative-details">
        <span><small>Стоимость</small><b>{initiative.cost} ед.</b></span>
        <span><small>Эффект через</small><b>{initiative.lag} {initiative.lag === 1 ? "шаг" : "шага"}</b></span>
      </div>

      <div className="effects" aria-label="Эффекты">
        <span className="effects-label">Эффект · {effectCount}</span>
        {Object.entries(initiative.effects).map(([indicator, value]) => (
          <span className={value < 0 ? "negative" : "positive"} key={indicator}>
            <b>{indicator}</b> {formatSigned(value)}
          </span>
        ))}
      </div>

      {initiative.type === "district" && (
        <label className="district-field">
          <span>Точка приложения</span>
          <div className="select-wrap">
            <select
              value={selectedDistrict}
              onChange={(event) => onDistrictChange(event.target.value)}
              disabled={!isSelected}
            >
              <option value="">Выберите район</option>
              {districts.map((district) => (
                <option value={district} key={district}>{district}</option>
              ))}
            </select>
          </div>
        </label>
      )}
    </article>
  );
}

function ResultScreen({ data, result, onEdit }) {
  const deltaTone = result.score_delta > 0 ? "positive" : result.score_delta < 0 ? "negative" : "";

  return (
    <main className="page results-page">
      <nav className="topbar" aria-label="Навигация приложения">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><i /> <i /> <i /></span>
          <span>ASTANA <b>LAB</b></span>
        </div>
        <div className="topbar-status results-status">
          <span className="result-dot" aria-hidden="true">✓</span>
          Сценарий рассчитан
        </div>
      </nav>
      <header className="results-header">
        <div>
          <p className="eyebrow">Результат · Этап 02 / 02</p>
          <h1>Город в новом <em>сценарии</em></h1>
          <p className="subtitle">Как пакет решений изменит качество жизни в Астане.</p>
        </div>
        <button className="button button-secondary" type="button" onClick={onEdit}>
          <span aria-hidden="true">←</span> Вернуться к решениям
        </button>
      </header>

      <section className="score-panel">
        <div className="main-score">
          <span>Astana Quality of Life Score</span>
          <div className="score-transition">
            <b>{formatNumber(result.baseline_score)}</b>
            <i aria-hidden="true">→</i>
            <strong>{formatNumber(result.final_score)}</strong>
          </div>
          <em className={deltaTone}><span aria-hidden="true">↗</span> {formatSigned(result.score_delta)} пункта</em>
        </div>
        <Metric label="Инвестировано" value={result.used_budget} suffix="ед." />
        <Metric label="Резерв" value={result.remaining_budget} suffix="ед." tone="accent" />
      </section>

      <section className="results-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Пять районов</span>
            <h2>Пульс города</h2>
            <p>Изменение индикаторов после реализации выбранных мер.</p>
          </div>
        </div>
        <div className="district-grid">
          {Object.keys(data.districts).map((district) => (
            <DistrictResult
              key={district}
              district={district}
              score={result.score.district_scores[district]}
              indicators={data.indicators}
              changes={result.changes[district]}
            />
          ))}
        </div>
      </section>

      <div className="result-columns">
        <section className="results-section critical-section">
          <div className="section-heading"><h2>Критические проблемы</h2></div>
          {result.critical_indicators.length === 0 ? (
            <p className="empty-state">Критических показателей нет</p>
          ) : (
            <div className="critical-list">
              {result.critical_indicators.map((item) => (
                <div key={`${item.district}-${item.indicator}`}>
                  <span>{item.district}</span>
                  <strong>
                    {item.indicator} — {capitalize(data.indicators[item.indicator])}: {formatNumber(item.value)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </section>

        {result.applied_synergies.length > 0 && (
          <section className="results-section synergy-section">
            <div className="section-heading"><h2>Сработавшие синергии</h2></div>
            <div className="synergy-list">
              {result.applied_synergies.map((synergy, index) => (
                <div key={`${synergy.initiatives.join("-")}-${synergy.district}-${index}`}>
                  <strong>{synergy.initiatives.join(" + ")}</strong>
                  <span>{synergy.district}</span>
                  <b title={data.indicators[synergy.indicator]}>
                    {synergy.indicator} — {capitalize(data.indicators[synergy.indicator])} {formatSigned(synergy.bonus)}
                  </b>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <AIAnalysis analysis={result.ai_analysis} />
    </main>
  );
}

function AIAnalysis({ analysis }) {
  if (!analysis) return null;

  const sections = [
    ["Сильные стороны", analysis.strengths],
    ["Риски", analysis.risks],
    ["Компромиссы", analysis.tradeoffs],
    ["Рекомендации", analysis.recommendations],
  ]
    .map(([title, items]) => [title, items.slice(0, 4)])
    .filter(([, items]) => items.length > 0);

  return (
    <section className="ai-analysis" aria-labelledby="ai-analysis-title">
      <div className="ai-analysis-heading">
        <div>
          <p className="eyebrow">Интерпретация результата</p>
          <h2 id="ai-analysis-title">AI-анализ сценария</h2>
        </div>
        <span>OpenAI</span>
      </div>

      <div className="ai-summary">
        <h3>Краткий вывод</h3>
        <p>{analysis.summary}</p>
      </div>

      {sections.length > 0 && (
        <div className="ai-analysis-grid">
          {sections.map(([title, items]) => (
            <section key={title}>
              <h3>{title}</h3>
              <ul>
                {items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function DistrictResult({ district, score, indicators, changes }) {
  const scoreValue = Math.max(0, Math.min(100, Number(score)));

  return (
    <article className="district-card">
      <div className="district-title">
        <div>
          <span className="district-overline">Район</span>
          <h3>{district}</h3>
        </div>
        <div className="district-score">
          <span>Score</span>
          <strong style={{ "--score": `${scoreValue}%` }}>{formatNumber(score)}</strong>
        </div>
      </div>
      <div className="indicator-list">
        {Object.entries(changes).map(([indicator, change]) => (
          <div className={change.delta === 0 ? "is-unchanged" : ""} key={indicator}>
            <span className="indicator-label">
              <b>{indicator}</b>
              <small>{capitalize(indicators[indicator])}</small>
            </span>
            <span>{formatNumber(change.before)} → {formatNumber(change.after)}</span>
            <strong className={change.delta < 0 ? "negative" : change.delta > 0 ? "positive" : ""}>
              {formatSigned(change.delta)}
            </strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function Metric({ label, value, suffix, tone = "" }) {
  return (
    <div className={`metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}{suffix ? ` ${suffix}` : ""}</strong>
    </div>
  );
}

function StatusScreen({ title, message, children }) {
  return (
    <main className="status-screen">
      <p className="eyebrow">Симулятор городских решений</p>
      <h1>{title}</h1>
      <p>{message}</p>
      {children}
    </main>
  );
}

function formatNumber(value) {
  return Number(value).toLocaleString("ru-RU", { maximumFractionDigits: 2 });
}

function formatSigned(value) {
  const number = Number(value);
  return `${number > 0 ? "+" : ""}${formatNumber(number)}`;
}

function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default App;
