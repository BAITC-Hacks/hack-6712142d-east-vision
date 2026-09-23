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
      <header className="page-header">
        <div>
          <p className="eyebrow">Симулятор городских решений</p>
          <h1>Аким на 5 часов</h1>
          <p className="subtitle">
            Распределите городской бюджет и примите 5 управленческих решений
          </p>
        </div>
        <div className="decision-count" aria-label="Количество решений">
          <strong>{selectedInitiatives.length}</strong>
          <span>/ 5 решений</span>
        </div>
      </header>

      <section className="budget-bar" aria-label="Бюджет">
        <Metric label="Бюджет" value={data.budget} suffix="ед." />
        <Metric label="Использовано" value={usedBudget} suffix="ед." />
        <Metric
          label="Осталось"
          value={remainingBudget}
          suffix="ед."
          tone={remainingBudget < 0 ? "danger" : "accent"}
        />
        <div className="budget-progress">
          <span style={{ width: `${Math.min((usedBudget / data.budget) * 100, 100)}%` }} />
        </div>
      </section>

      {warnings.length > 0 && (
        <div className="notice" role="status">
          {warnings.map((warning) => <p key={warning}>{warning}</p>)}
        </div>
      )}

      <div className="category-list">
        {CATEGORY_ORDER.map((category) => {
          const initiatives = data.initiatives.filter(
            (initiative) => initiative.category === category,
          );
          if (initiatives.length === 0) return null;

          return (
            <section className="category-section" key={category}>
              <div className="section-heading">
                <h2>{CATEGORY_LABELS[category]}</h2>
                <span>{categoryCounts[category] || 0} / 2 выбрано</span>
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
        <div>
          <strong>{selectedInitiatives.length} из 5 решений</strong>
          <span>{usedBudget} из {data.budget} ед. бюджета</span>
        </div>
        <button
          className="button button-primary"
          type="button"
          onClick={runSimulation}
          disabled={!canSimulate || isSimulating}
        >
          {isSimulating ? "Симуляция и AI-анализ..." : "Запустить симуляцию"}
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
  return (
    <article className={`initiative-card ${isSelected ? "is-selected" : ""}`}>
      <label className="initiative-choice">
        <input type="checkbox" checked={isSelected} onChange={onToggle} />
        <span className="checkmark" aria-hidden="true">✓</span>
        <span className="initiative-copy">
          <span className="initiative-meta">
            <strong>{initiative.id}</strong>
            <span>{initiative.type === "district" ? "Район" : "Город"}</span>
          </span>
          <span className="initiative-name">{initiative.name}</span>
        </span>
      </label>

      <div className="initiative-details">
        <span><b>{initiative.cost}</b> ед.</span>
        <span>Лаг: <b>{initiative.lag}</b></span>
      </div>

      <div className="effects" aria-label="Эффекты">
        {Object.entries(initiative.effects).map(([indicator, value]) => (
          <span className={value < 0 ? "negative" : "positive"} key={indicator}>
            {indicator} {formatSigned(value)}
          </span>
        ))}
      </div>

      {initiative.type === "district" && (
        <label className="district-field">
          <span>Район</span>
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
        </label>
      )}
    </article>
  );
}

function ResultScreen({ data, result, onEdit }) {
  const deltaTone = result.score_delta > 0 ? "positive" : result.score_delta < 0 ? "negative" : "";

  return (
    <main className="page results-page">
      <header className="results-header">
        <div>
          <p className="eyebrow">Результат симуляции</p>
          <h1>Astana Quality of Life Score</h1>
        </div>
        <button className="button button-secondary" type="button" onClick={onEdit}>
          Изменить решения
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
          <em className={deltaTone}>{formatSigned(result.score_delta)}</em>
        </div>
        <Metric label="Использовано" value={`${result.used_budget} / ${data.budget}`} />
        <Metric label="Осталось" value={result.remaining_budget} suffix="ед." tone="accent" />
      </section>

      <section className="results-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Пять районов</p>
            <h2>Итоговые показатели</h2>
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
  return (
    <article className="district-card">
      <div className="district-title">
        <h3>{district}</h3>
        <div><span>Score</span><strong>{formatNumber(score)}</strong></div>
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
