import React from "react";
import { Icon } from "../Icon";
export default function Empty({ icon, title, text, action, label }) {
  return (
    <div className="empty-scenario">
      <div className="empty-orbit">
        <Icon name={icon} size={38} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="primary-button" onClick={action}>
        {label}
        <Icon name="arrow" size={17} />
      </button>
    </div>
  );
}
