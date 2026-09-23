import React from "react";
import { Icon } from "../Icon";
export default function Sidebar({
  page,
  navigate,
  decisions,
  result,
  setHelp,
}) {
  return (
    <aside className="sidebar">
      <a
        className="brand"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          navigate("overview");
        }}
      >
        <span className="brand-mark">
          a<span>ı</span>
        </span>
        <span>
          akim<span className="brand-dot">.</span>
          <small>ГОРОД НАЧИНАЕТСЯ С ВАС</small>
        </span>
      </a>
      <div className="workspace-label">ГОРОДСКАЯ ЛАБОРАТОРИЯ</div>
      <nav aria-label="Основная навигация">
        {[
          ["overview", "grid", "Обзор города"],
          ["initiatives", "bolt", "Инициативы"],
          ["districts", "map", "Районы"],
          ["scenario", "chart", "Мой сценарий"],
        ].map(([id, icon, label]) => (
          <button
            key={id}
            onClick={() => navigate(id)}
            className={`nav-item ${page === id ? "selected" : ""}`}
            aria-label={label}
            aria-current={page === id ? "page" : undefined}
          >
            <Icon name={icon} />
            <span className="nav-label">{label}</span>
            {id === "scenario" && (
              <span className="nav-count">{decisions.length}</span>
            )}
          </button>
        ))}
        <button
          className={`nav-item ${page === "results" ? "selected" : ""}`}
          onClick={() => navigate("results")}
          aria-label="Результаты"
        >
          <Icon name="spark" />
          <span className="nav-label">Результаты</span>
          {result && <span className="result-ready" />}
        </button>
      </nav>
      <div className="sidebar-note">
        <span className="tiny-label">ВАША МИССИЯ</span>
        <h3>
          Пять решений.
          <br />
          Большое будущее.
        </h3>
        <p>
          Создайте город, в котором хочется жить. Начните с тех, кому нужнее.
        </p>
        <div className="mission-dots">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={i < decisions.length ? "filled" : ""} />
          ))}
        </div>
        <span>{decisions.length} из 5 решений принято</span>
      </div>
      <button className="help-button" onClick={() => setHelp(true)}>
        <Icon name="info" />
        Как это работает <span>↗</span>
      </button>
      <div className="profile">
        <span className="avatar">АК</span>
        <div>
          <strong>Аким города</strong>
          <small>Астана · рабочее пространство</small>
        </div>
        <span className="online-dot" />
      </div>
    </aside>
  );
}
