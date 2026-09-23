import React, { useState } from "react";
import { Icon } from "./Icon";
import CityMap from "./CityMap";
import Results from "./Results";
import { profiles, fmt } from "./presentation";
import useScenario from "./hooks/useScenario";
import Empty from "./components/Empty";
import HelpDialog from "./components/HelpDialog";
import Sidebar from "./components/Sidebar";
import InitiativeCatalog from "./components/InitiativeCatalog";
import ScenarioPage from "./components/ScenarioPage";
import ScenarioPanel from "./components/ScenarioPanel";

export default function App() {
  const [page, setPage] = useState("overview");
  const [category, setCategory] = useState("all");
  const [help, setHelp] = useState(false);
  function navigate(next) {
    setPage(next);
    window.scrollTo({
      top: 0,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }
  const {
    data,
    connected,
    connecting,
    activeDistrict,
    setActiveDistrict,
    decisions,
    result,
    busy,
    notice,
    setNotice,
    baseline,
    names,
    district,
    chosen,
    used,
    shownScore,
    load,
    replaceDecisions,
    toggle,
    changeDistrict,
    run,
  } = useScenario(navigate);
  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        navigate={navigate}
        decisions={decisions}
        result={result}
        setHelp={setHelp}
      />
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Городская лаборатория <span>/</span>
            <strong>Астана</strong>
          </div>
          <div className="topbar-right">
            <button
              className={`connection-status ${connected ? "connected" : ""}`}
              onClick={load}
              disabled={connecting || busy}
            >
              <span className={connecting ? "status-pulse" : ""} />
              {connecting
                ? "Подключаемся…"
                : connected
                  ? "Сервер подключён"
                  : "Демо · подключить сервер"}
            </button>
            <span className="edition">HACKALEM / 2026</span>
          </div>
        </header>
        <main>
          <section className="page-heading">
            <div>
              <div className="eyebrow">
                <span /> ГОРОД В ВАШИХ РУКАХ
              </div>
              <h1>
                {page === "overview"
                  ? "Большие перемены."
                  : page === "initiatives"
                    ? "Решения с характером."
                    : page === "districts"
                      ? "Каждый район важен."
                      : page === "results"
                        ? "Ваш вклад в будущее."
                        : "План, который меняет город."}
                <span>
                  {page === "overview"
                    ? "Начните с пяти решений."
                    : page === "initiatives"
                      ? "Выберите свои приоритеты."
                      : page === "districts"
                        ? "Услышьте его потребности."
                        : page === "results"
                          ? "Посмотрите на результат."
                          : "От идеи — к действию."}
                </span>
              </h1>
              <p>
                Распределяйте ресурсы. Развивайте районы. Создавайте Астану для
                людей.
              </p>
            </div>
            <button className="subtle-button" onClick={() => setHelp(true)}>
              <Icon name="clock" size={16} />8 кварталов · 2 года
              <Icon name="info" size={15} />
            </button>
          </section>
          {!connected && !connecting && (
            <div className="demo-notice">
              <Icon name="info" size={17} />
              <span>
                Демонстрация интерфейса. Для расчёта сценария подключите сервер
                симуляции.
              </span>
              <button onClick={load}>
                Повторить подключение <Icon name="arrow" size={14} />
              </button>
            </div>
          )}
          <div
            className={`dashboard-layout ${page === "results" && result ? "result-layout" : ""}`}
          >
            <div className="content-column">
              {(page === "overview" || page === "districts") && (
                <section className="map-panel panel page-enter">
                  <div className="section-header">
                    <div>
                      <h2>
                        Пульс города{" "}
                        <span className="small-pill">
                          {names.length} районов
                        </span>
                      </h2>
                      <p>У каждого района — свои точки роста</p>
                    </div>
                    <span className="live-label">
                      <span />
                      {result ? "Сценарий рассчитан" : "Исходные показатели"}
                    </span>
                  </div>
                  <div className="map-content">
                    <CityMap
                      active={activeDistrict}
                      onSelect={setActiveDistrict}
                      decisions={chosen}
                      districts={baseline.districts}
                      resultScores={result?.score?.district_scores}
                    />
                    <div className="map-legend">
                      <span>
                        <i className="legend-dot" />
                        Выбранный район
                      </span>
                      <span>Условная схема · не географическая карта</span>
                    </div>
                  </div>
                  <div className="district-strip">
                    <div className="district-icon">
                      <Icon name="pin" />
                    </div>
                    <div className="district-copy">
                      <strong>
                        {district.name}
                        <span>{fmt(district.population)}% населения</span>
                      </strong>
                      <p>{profiles[district.name]}</p>
                    </div>
                    <div className="district-score">
                      <strong>{fmt(district.score)}</strong>
                      <span>исходный индекс</span>
                    </div>
                  </div>
                </section>
              )}
              {page === "districts" && (
                <section className="panel district-detail page-enter">
                  <div className="section-header">
                    <div>
                      <h2>Показатели · {district.name}</h2>
                      <p>Исходная ситуация по десяти показателям</p>
                    </div>
                  </div>
                  {Object.entries(data.districts[district.name].indicators).map(
                    ([key, value], i) => (
                      <div
                        className="indicator-row"
                        key={`${district.name}-${key}`}
                        style={{
                          "--order": i,
                        }}
                      >
                        <span>{data.indicators[key]}</span>
                        <div className="indicator-track">
                          <span
                            className={value < 40 ? "critical-bar" : ""}
                            style={{
                              width: `${value}%`,
                            }}
                          />
                        </div>
                        <strong>{value}</strong>
                      </div>
                    ),
                  )}
                </section>
              )}
              {(page === "overview" || page === "initiatives") && (
                <InitiativeCatalog
                  data={data}
                  category={category}
                  setCategory={setCategory}
                  activeDistrict={activeDistrict}
                  setActiveDistrict={setActiveDistrict}
                  names={names}
                  decisions={decisions}
                  busy={busy}
                  changeDistrict={changeDistrict}
                  toggle={toggle}
                />
              )}
              {page === "scenario" && (
                <ScenarioPage
                  chosen={chosen}
                  names={names}
                  busy={busy}
                  changeDistrict={changeDistrict}
                  toggle={toggle}
                  navigate={navigate}
                />
              )}
              {page === "results" &&
                (result ? (
                  <Results
                    data={data}
                    result={result}
                    baseline={baseline}
                    onEdit={() => navigate("scenario")}
                  />
                ) : (
                  <section className="panel page-enter">
                    <Empty
                      icon="chart"
                      title="Здесь появится результат ваших решений"
                      text="Соберите пять инициатив и запустите симуляцию. Получите индекс качества жизни, изменения по районам и анализ."
                      action={() => navigate("initiatives")}
                      label="Перейти к инициативам"
                    />
                  </section>
                ))}
            </div>
            <ScenarioPanel
              shownScore={shownScore}
              result={result}
              data={data}
              used={used}
              chosen={chosen}
              busy={busy}
              connected={connected}
              run={run}
              toggle={toggle}
              replaceDecisions={replaceDecisions}
              setActiveDistrict={setActiveDistrict}
              baseline={baseline}
              setCategory={setCategory}
              navigate={navigate}
            />
          </div>
          <footer className="page-footer">
            <span>
              akim. <span>Маленькие решения. Большое будущее.</span>
            </span>
            <span>
              {connected
                ? "Синтетическая модель · данные сервера"
                : "Демонстрационные данные"}{" "}
              · East Vision
            </span>
          </footer>
        </main>
      </div>
      {notice && (
        <div className="toast" role="alert">
          <Icon name="info" />
          <span>{notice}</span>
          <button
            className="icon-button"
            aria-label="Закрыть уведомление"
            onClick={() => setNotice("")}
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      )}
      <HelpDialog help={help} setHelp={setHelp} budget={data.budget} />
    </div>
  );
}
