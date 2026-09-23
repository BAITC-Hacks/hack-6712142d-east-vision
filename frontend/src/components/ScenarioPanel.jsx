import React, { useState, useRef, useEffect } from "react";
import { Icon } from "../Icon";
import { fmt } from "../presentation";
function AnimatedNumber({ value }) {
  const [shown, setShown] = useState(value);
  const current = useRef(value);
  useEffect(() => {
    const start = current.current;
    let frame;
    const beginning = performance.now();
    function tick(now) {
      const t = Math.min((now - beginning) / 450, 1);
      current.current = start + (value - start) * (1 - Math.pow(1 - t, 3));
      setShown(current.current);
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      current.current = value;
      return;
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{fmt(Math.round(shown * 100) / 100)}</>;
}
export default function ScenarioPanel({
  shownScore,
  result,
  data,
  used,
  chosen,
  busy,
  connected,
  run,
  toggle,
  replaceDecisions,
  setActiveDistrict,
  baseline,
  setCategory,
  navigate,
}) {
  return (
    <aside className="right-column">
      <section className="score-card">
        <div className="score-header">
          <span>КАЧЕСТВО ЖИЗНИ</span>
          <Icon name="chart" size={20} />
        </div>
        <div className="score-value">
          <AnimatedNumber value={shownScore} />
          <small>/ 100</small>
        </div>
        <div className="score-track">
          <span
            style={{
              width: `${Math.max(0, Math.min(shownScore, 100))}%`,
            }}
          />
        </div>
        <p>Astana Quality of Life Score</p>
        <div className="score-footer">
          <span className="dark-dot" />
          {result
            ? "Результат вашей симуляции"
            : "Отправная точка вашего сценария"}
        </div>
        <div className="score-orbit orbit-one" />
        <div className="score-orbit orbit-two" />
      </section>
      <section className="panel budget-panel">
        <div className="section-header">
          <h2>Бюджет города</h2>
          <Icon name="bolt" size={18} />
        </div>
        <div className="budget-value">
          <AnimatedNumber value={data.budget - used} />
          <span>/ {data.budget} ед.</span>
        </div>
        <p className="budget-caption">доступно для ваших решений</p>
        <div className="budget-track">
          <span
            style={{
              width: `${(used / data.budget) * 100}%`,
            }}
          />
        </div>
        <div className="budget-labels">
          <span>
            <i />
            Распределено
          </span>
          <strong>{used} ед.</strong>
        </div>
        <div className="budget-divider" />
        <div className="plan-heading">
          <h3>Ваши решения</h3>
          <span>{chosen.length} из 5</span>
        </div>
        <div className="decision-slots">
          {Array.from(
            {
              length: 5,
            },
            (_, i) =>
              chosen[i] ? (
                <div className="decision-slot occupied" key={chosen[i].id}>
                  <span className="slot-number">
                    <Icon name="check" size={13} />
                  </span>
                  <div>
                    <strong title={chosen[i].name}>{chosen[i].name}</strong>
                    <small>
                      {chosen[i].district || "Весь город"} · {chosen[i].cost}{" "}
                      ед.
                    </small>
                  </div>
                  <button
                    disabled={busy}
                    className="icon-button"
                    aria-label={`Удалить решение ${i + 1}`}
                    onClick={() => toggle(chosen[i])}
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ) : (
                <div className="decision-slot" key={`empty-${i}`}>
                  <span className="slot-number">0{i + 1}</span>
                  <span>Место для перемен</span>
                  <span className="slot-plus">+</span>
                </div>
              ),
          )}
        </div>
        <button
          className="primary-button simulate-button"
          disabled={busy || chosen.length !== 5 || !connected}
          onClick={run}
        >
          {busy ? (
            <>
              <span className="spinner" />
              Рассчитываем сценарий…
            </>
          ) : (
            <>
              Запустить симуляцию <Icon name="arrow" size={17} />
            </>
          )}
        </button>
        <p className="button-hint">
          {busy
            ? "Модель считает эффект, AI готовит объяснение"
            : !connected
              ? "Расчёт доступен после подключения сервера"
              : chosen.length === 5
                ? "Город готов к вашим решениям"
                : "Выберите ровно 5 инициатив"}
        </p>
        {chosen.length > 0 && (
          <button
            className="reset-button"
            disabled={busy}
            onClick={() => replaceDecisions([])}
          >
            Сбросить сценарий
          </button>
        )}
      </section>
      <section className="insight-card">
        <span className="insight-icon">
          <Icon name="spark" />
        </span>
        <div>
          <h3>Начните с тех, кому нужнее</h3>
          <p>
            Поддержка самого слабого района влияет на итоговую оценку всего
            города.
          </p>
          <button
            onClick={() => {
              setActiveDistrict(
                baseline.districts.reduce((a, b) => (a.score < b.score ? a : b))
                  .name,
              );
              setCategory("social");
              navigate("initiatives");
            }}
          >
            Найти точку роста <Icon name="arrow" size={15} />
          </button>
        </div>
      </section>
    </aside>
  );
}
