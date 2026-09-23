import React from "react";
import { Icon } from "../Icon";
import Empty from "./Empty";
export default function ScenarioPage({
  chosen,
  names,
  busy,
  changeDistrict,
  toggle,
  navigate,
}) {
  return (
    <section className="panel scenario-page page-enter">
      <div className="section-header">
        <div>
          <h2>Ваш сценарий развития</h2>
          <p>Пять решений на ближайшие два года</p>
        </div>
        <span className="small-pill">{chosen.length} / 5</span>
      </div>
      {chosen.length ? (
        chosen.map((item, index) => (
          <div className="scenario-row" key={item.id}>
            <span className="row-number">0{index + 1}</span>
            <div>
              <h3>{item.name}</h3>
              {item.type === "district" ? (
                <select
                  className="inline-district"
                  aria-label={`Район: ${item.name}`}
                  value={item.district}
                  disabled={busy}
                  onChange={(e) => changeDistrict(item.id, e.target.value)}
                >
                  {names.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              ) : (
                <p>Весь город</p>
              )}
              <p>Эффект начинается через {item.lag} кв.</p>
            </div>
            <strong>{item.cost} ед.</strong>
            <button
              className="icon-button"
              disabled={busy}
              aria-label={`Убрать: ${item.name}`}
              onClick={() => toggle(item)}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ))
      ) : (
        <Empty
          icon="map"
          title="Дайте городу направление"
          text="Добавьте инициативы, чтобы собрать свой первый сценарий."
          action={() => navigate("initiatives")}
          label="Выбрать инициативы"
        />
      )}
      {chosen.length > 0 && (
        <button className="text-button" onClick={() => navigate("overview")}>
          Посмотреть изменения на карте <Icon name="arrow" size={16} />
        </button>
      )}
    </section>
  );
}
