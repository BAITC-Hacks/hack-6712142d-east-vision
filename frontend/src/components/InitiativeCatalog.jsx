import React from "react";
import { Icon } from "../Icon";
import { categories, descriptions } from "../presentation";
export default function InitiativeCatalog({
  data,
  category,
  setCategory,
  activeDistrict,
  setActiveDistrict,
  names,
  decisions,
  busy,
  changeDistrict,
  toggle,
}) {
  const visible = data.initiatives.filter(
    (i) => category === "all" || i.category === category,
  );
  return (
    <section className="initiatives-section page-enter">
      <div className="section-header initiative-header">
        <div>
          <div className="eyebrow muted">ОТ ВОЗМОЖНОСТЕЙ К ДЕЙСТВИЯМ</div>
          <h2>Какой будет ваша Астана?</h2>
        </div>
        <span className="catalog-count">
          {data.initiatives.length} инициатив
        </span>
      </div>
      <div
        className="category-tabs"
        role="group"
        aria-label="Направление инициатив"
      >
        {categories.map((c) => (
          <button
            key={c.id}
            aria-pressed={category === c.id}
            onClick={() => setCategory(c.id)}
            className={category === c.id ? "active" : ""}
          >
            <Icon name={c.icon} size={16} />
            {c.name}
          </button>
        ))}
      </div>
      <div className="catalog-toolbar">
        <span>Не более двух мер одного направления</span>
        <label>
          <Icon name="pin" size={15} />
          <select
            aria-label="Район для новых инициатив"
            value={activeDistrict}
            onChange={(e) => setActiveDistrict(e.target.value)}
          >
            {names.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="initiative-grid" key={category}>
        {visible.map((item, index) => {
          const cat = categories.find((c) => c.id === item.category);
          const decision = decisions.find((d) => d.id === item.id);
          return (
            <article
              className={`initiative-card ${decision ? "is-selected" : ""}`}
              key={item.id}
              style={{
                "--order": index,
              }}
            >
              <div className="card-top">
                <span className={`category-icon ${item.category}`}>
                  <Icon name={cat?.icon} size={22} />
                </span>
                <span className="card-category">
                  {cat?.name || item.category}
                </span>
                <span className="initiative-id">{item.id}</span>
              </div>
              <h3>{item.name}</h3>
              <p>
                {descriptions[item.id] ||
                  "Инвестиция в качество городской среды."}
              </p>
              <div className="effect-chips">
                {Object.entries(item.effects).map(([key, v]) => (
                  <span
                    key={key}
                    className={v < 0 ? "negative" : ""}
                    title={data.indicators[key]}
                  >
                    {data.indicators[key] || key}{" "}
                    <b>
                      {v > 0 ? "+" : ""}
                      {v}
                    </b>
                  </span>
                ))}
              </div>
              <div className="card-meta">
                <span>
                  <Icon name="pin" size={13} />
                  {item.type === "city"
                    ? "Весь город"
                    : decision?.district || activeDistrict}
                </span>
                <span>
                  <Icon name="clock" size={13} />
                  {item.lag} кв.
                </span>
              </div>
              {decision && item.type === "district" && (
                <select
                  className="inline-district"
                  aria-label={`Район: ${item.name}`}
                  value={decision.district}
                  disabled={busy}
                  onChange={(e) => changeDistrict(item.id, e.target.value)}
                >
                  {names.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              )}
              <div className="card-bottom">
                <div>
                  <strong>{item.cost}</strong>
                  <span> ед. бюджета</span>
                </div>
                <button
                  disabled={busy}
                  className={`add-button ${decision ? "added" : ""}`}
                  onClick={() => toggle(item)}
                  aria-label={`${decision ? "Убрать" : "Добавить"}: ${item.name}`}
                >
                  <Icon name={decision ? "check" : "plus"} size={17} />
                  {decision ? "В сценарии" : "Добавить"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <p className="catalog-footnote">
        Показаны полные эффекты мероприятий. При расчёте сервер учитывает срок
        запуска, синергии и ограничения.
      </p>
    </section>
  );
}
