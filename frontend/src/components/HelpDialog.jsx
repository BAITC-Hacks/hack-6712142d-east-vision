import React, { useRef, useEffect } from "react";
import { Icon } from "../Icon";
export default function HelpDialog({ help, setHelp, budget }) {
  const helpRef = useRef(null);
  useEffect(() => {
    if (!help) return;
    const previous = document.activeElement;
    helpRef.current?.querySelector("button")?.focus();
    function onKey(e) {
      if (e.key === "Escape") setHelp(false);
      if (e.key === "Tab") {
        const elements = helpRef.current?.querySelectorAll("button,a[href]");
        if (!elements?.length) return;
        const first = elements[0],
          last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [help]);
  return (
    help && (
      <div className="modal-backdrop" onClick={() => setHelp(false)}>
        <section
          className="help-modal"
          ref={helpRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-title"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="modal-close icon-button"
            aria-label="Закрыть правила"
            onClick={() => setHelp(false)}
          >
            <Icon name="close" />
          </button>
          <span className="category-icon">
            <Icon name="map" size={26} />
          </span>
          <h2 id="help-title">Город начинается с ваших решений</h2>
          <p>
            Выберите ровно пять инициатив на бюджет {budget} единиц. Горизонт
            развития — восемь кварталов.
          </p>
          <ol>
            <li>
              Изучите потребности районов и выберите место для инициативы.
            </li>
            <li>
              Добавьте до двух мер в каждом направлении. Учитывайте стоимость и
              совместимость.
            </li>
            <li>Сравните карту «Сейчас» и «С решениями».</li>
            <li>Запустите симуляцию и изучите результат и анализ.</li>
          </ol>
          <div className="help-note">
            Итоговый балл учитывает город в целом, самый слабый район и
            показатели ниже 40. Остаток бюджета не даёт бонуса.
          </div>
          <button className="primary-button" onClick={() => setHelp(false)}>
            Начать менять город <Icon name="arrow" size={17} />
          </button>
        </section>
      </div>
    )
  );
}
