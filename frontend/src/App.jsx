import React from "react"; 
import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function App() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState({});
  const [districtsByInitiative, setDistrictsByInitiative] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/data`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Не удалось загрузить данные.");
        }
        return response.json();
      })
      .then(setData)
      .catch((loadError) => setError(loadError.message));
  }, []);

  const selectedInitiatives = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.initiatives.filter((initiative) => selected[initiative.id]);
  }, [data, selected]);

  const usedBudget = selectedInitiatives.reduce(
    (sum, initiative) => sum + initiative.cost,
    0
  );
  const remainingBudget = data ? data.budget - usedBudget : 0;

  function toggleInitiative(initiative) {
    setResult(null);
    setError("");
    setSelected((current) => ({
      ...current,
      [initiative.id]: !current[initiative.id],
    }));
  }

  function updateDistrict(initiativeId, district) {
    setDistrictsByInitiative((current) => ({
      ...current,
      [initiativeId]: district,
    }));
  }

  async function runSimulation() {
    if (!data) {
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const decisions = selectedInitiatives.map((initiative) => ({
      initiative_id: initiative.id,
      district:
        initiative.type === "district"
          ? districtsByInitiative[initiative.id] || ""
          : null,
    }));

    try {
      const response = await fetch(`${API_URL}/api/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisions }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.detail || "Ошибка симуляции.");
      }

      setResult(json);
    } catch (simulateError) {
      setError(simulateError.message);
    } finally {
      setLoading(false);
    }
  }

  if (!data) {
    return (
      <main className="page">
        <h1>Аким на 5 часов</h1>
        <p>{error || "Загрузка..."}</p>
      </main>
    );
  }

  return (
    <main className="page">
      <h1>Аким на 5 часов</h1>

      <section className="summary">
        <p>Бюджет: {data.budget}</p>
        <p>Использовано: {usedBudget}</p>
        <p>Остаток: {remainingBudget}</p>
        <p>Выбрано решений: {selectedInitiatives.length} / 5</p>
      </section>

      <section>
        <h2>Мероприятия</h2>
        <div className="initiative-list">
          {data.initiatives.map((initiative) => (
            <article className="initiative" key={initiative.id}>
              <label className="initiative-title">
                <input
                  type="checkbox"
                  checked={Boolean(selected[initiative.id])}
                  onChange={() => toggleInitiative(initiative)}
                />
                <span>
                  {initiative.id}. {initiative.name}
                </span>
              </label>

              <p>category: {initiative.category}</p>
              <p>cost: {initiative.cost}</p>
              <p>lag: {initiative.lag}</p>
              <p>effects: {formatEffects(initiative.effects)}</p>

              {initiative.type === "district" && (
                <label className="field">
                  Район
                  <select
                    value={districtsByInitiative[initiative.id] || ""}
                    onChange={(event) =>
                      updateDistrict(initiative.id, event.target.value)
                    }
                    disabled={!selected[initiative.id]}
                  >
                    <option value="">Выберите район</option>
                    {Object.keys(data.districts).map((district) => (
                      <option value={district} key={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </article>
          ))}
        </div>
      </section>

      <button type="button" onClick={runSimulation} disabled={loading}>
        {loading ? "Запуск..." : "Запустить симуляцию"}
      </button>

      {error && <pre className="error">{error}</pre>}
      {result && <pre className="result">{JSON.stringify(result, null, 2)}</pre>}
    </main>
  );
}

function formatEffects(effects) {
  return Object.entries(effects)
    .map(([indicator, value]) => `${indicator} ${value > 0 ? "+" : ""}${value}`)
    .join(", ");
}

export default App;
