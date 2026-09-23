import React, { useId, useState } from "react";
import { places, changes, positions } from "./constants/cityMap";
import { House, Tree, Landmark, Upgrade } from "./components/CityIllustrations";
import "./CityMap.css";
export default function CityMap({
  active,
  onSelect,
  decisions = [],
  districts = [],
  resultScores = null,
}) {
  const uid = useId().replaceAll(":", "");
  const [preview, setPreview] = useState(true);
  const place = places.find((p) => p.name === active) || places[0];
  const relevant = decisions.filter(
    (d) => d.type === "city" || d.district === active,
  );
  return (
    <div className="city-scene">
      <div className="scene-toolbar">
        <span className="scene-caption">АСТАНА В МИНИАТЮРЕ</span>
        <div className="scene-switch" role="group" aria-label="Слои карты">
          <button aria-pressed={!preview} onClick={() => setPreview(false)}>
            Сейчас
          </button>
          <button aria-pressed={preview} onClick={() => setPreview(true)}>
            С решениями <span>{decisions.length}</span>
          </button>
        </div>
      </div>
      <svg
        className="city-map illustrated-map"
        viewBox="0 0 650 420"
        role="group"
        aria-label="Миниатюрная схема пяти районов Астаны"
      >
        <defs>
          <pattern
            id={`${uid}-dots`}
            width="18"
            height="18"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r=".65" fill="#c4d1e5" />
          </pattern>
          <pattern
            id={`${uid}-grid`}
            width="24"
            height="24"
            patternTransform="rotate(-18)"
            patternUnits="userSpaceOnUse"
          >
            <path d="M0 0H24V24" fill="none" stroke="#fff" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="650" height="420" fill={`url(#${uid}-dots)`} />
        <path
          d="M-30 160C130 90 89 262 228 209S373 184 398 283 522 350 680 331"
          fill="none"
          stroke="#d3e7ff"
          strokeWidth="20"
        />
        <path
          d="M-30 160C130 90 89 262 228 209S373 184 398 283 522 350 680 331"
          fill="none"
          stroke="#f0f7ff"
          strokeWidth="1"
        />
        {places.map((p) => {
          const upgrades = preview
            ? decisions.filter(
                (d) => d.type === "city" || d.district === p.name,
              )
            : [];
          return (
            <g
              key={p.name}
              className={`map-region ${active === p.name ? "active" : ""}`}
              role="button"
              tabIndex={0}
              aria-label={`Район ${p.name}: ${p.title}`}
              aria-pressed={active === p.name}
              onClick={() => onSelect(p.name)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(p.name);
                }
              }}
            >
              <title>
                {p.name} — {p.title}
                {upgrades.length
                  ? `. Изменения: ${upgrades.map((d) => changes[d.id]).join(", ")}`
                  : ""}
              </title>
              <path
                d={p.path}
                className="region-plinth"
                transform="translate(0 6)"
              />
              <path d={p.path} className="region-fill" />
              <path d={p.path} fill={`url(#${uid}-grid)`} opacity=".6" />
              <g className="city-decoration" pointerEvents="none">
                {p.buildings.map(([x, y, h], i) => (
                  <House key={i} x={x} y={y} height={h} />
                ))}
                <Tree x={p.x - 31} y={p.y - 30} scale={0.52} />
                <Tree x={p.x + 36} y={p.y + 4} scale={0.6} />
                <g
                  className="landmark-mini"
                  transform={`translate(${p.x} ${p.y - 9}) scale(.78)`}
                >
                  <Landmark kind={p.kind} />
                </g>
                {upgrades.map((d) => (
                  <g
                    key={d.id}
                    transform={`translate(${p.x + positions[d.id][0]} ${p.y + positions[d.id][1]}) scale(.65)`}
                  >
                    <g className="map-upgrade">
                      <ellipse
                        cy="4"
                        rx="25"
                        ry="12"
                        fill="#c2f1dc"
                        opacity=".55"
                      />
                      <Upgrade id={d.id} />
                    </g>
                  </g>
                ))}
              </g>
              <g className="district-label" pointerEvents="none">
                <rect x={p.x - 36} y={p.y + 17} width="72" height="33" rx="8" />
                <text
                  x={p.x}
                  y={p.y + 31}
                  textAnchor="middle"
                  className="map-name"
                >
                  {p.name}
                </text>
                <text
                  x={p.x}
                  y={p.y + 43}
                  textAnchor="middle"
                  className="map-score"
                >
                  {Number(
                    (preview && resultScores?.[p.name]) ??
                      districts.find((d) => d.name === p.name)?.score ??
                      0,
                  ).toFixed(1)}
                </text>
              </g>
              {upgrades.length > 0 && (
                <g
                  className="upgrade-count"
                  transform={`translate(${p.x + 34} ${p.y + 18})`}
                >
                  <circle r="8" />
                  <text textAnchor="middle" y="3">
                    +{upgrades.length}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        <text x="478" y="372" className="river-label">
          Е С И Л Ь
        </text>
        <g transform="translate(611 34)" stroke="#8497b4" fill="none">
          <path d="m0 24 7-20 7 20-7-5Z" />
          <text
            x="7"
            y="-3"
            textAnchor="middle"
            stroke="none"
            fill="#8497b4"
            fontSize="10"
          >
            С
          </text>
        </g>
      </svg>
      <div className="landmark-detail">
        <div className="landmark-thumbnail">
          <svg viewBox="-44 -82 88 104" aria-hidden="true">
            <Landmark kind={place.kind} />
          </svg>
        </div>
        <div className="landmark-description">
          <span>ОРИЕНТИР РАЙОНА · {place.name}</span>
          <strong>{place.title}</strong>
          <p>
            {place.address} · {place.detail}
          </p>
        </div>
        <a
          href={place.source}
          target="_blank"
          rel="noreferrer"
          aria-label={`Источник: ${place.title}`}
        >
          Об объекте ↗
        </a>
      </div>
      <div className="map-change-summary" aria-live="polite">
        <span
          className={
            preview && relevant.length ? "change-dot" : "change-dot inactive"
          }
        />
        <div>
          {preview && relevant.length ? (
            <>
              <strong>В районе появится</strong>
              <p>{relevant.map((d) => changes[d.id]).join(" · ")}</p>
            </>
          ) : (
            <>
              <strong>
                {preview
                  ? "Выберите инициативу — город изменится"
                  : "Исходный облик города"}
              </strong>
              <p>
                {preview
                  ? "Парки, школы, транспорт и сервисы появятся на схеме выбранного района."
                  : "Переключитесь на «С решениями», чтобы сравнить с вашим планом."}
              </p>
            </>
          )}
        </div>
      </div>
      <p className="scene-disclaimer">
        {resultScores && preview
          ? "Индексы районов рассчитаны сервером для выбранного сценария."
          : "Визуальный предпросмотр решений. Индексы на карте — исходные значения."}
      </p>
    </div>
  );
}
