import React from "react";
export function Tree({ x = 0, y = 0, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cy="3" rx="7" ry="3" fill="#254b6a" opacity=".12" />
      <path d="M0 1v-13" stroke="#59796a" strokeWidth="2" />
      <path
        d="M0-27C-12-22-10-9 0-8 10-9 12-22 0-27"
        fill="#91c5b3"
        stroke="#518f7c"
        strokeWidth=".7"
      />
      <path d="M0-24v13" stroke="#d1ecdf" strokeWidth="1" />
    </g>
  );
}
export function House({ x, y, height = 25 }) {
  return (
    <g className="mini-house" transform={`translate(${x} ${y})`}>
      <path d="m-12 2 18 6 14-7-18-6Z" fill="#203756" opacity=".10" />
      <path
        d={`M-9 0V${-height}l15 4V4Z`}
        fill="#f8fbff"
        stroke="#7f98bc"
        strokeWidth=".7"
      />
      <path
        d={`m6 4 10-6v${-height}L6 ${-height + 4}Z`}
        fill="#bccde5"
        stroke="#7f98bc"
        strokeWidth=".7"
      />
      <path
        d={`m-9 ${-height} 10-6 15 4-10 6Z`}
        fill="#e4edfb"
        stroke="#7f98bc"
        strokeWidth=".7"
      />
      {Array.from(
        {
          length: Math.floor(height / 7),
        },
        (_, i) => (
          <path
            key={i}
            d={`M-5 ${-height + 6 + i * 7}l7 2m8-1 3-2`}
            stroke="#7496c6"
            strokeWidth="2"
          />
        ),
      )}
    </g>
  );
}
function Dome({ x = 0, y = 0, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M-6 0C-13-10-2-12 0-20 2-12 13-10 6 0Z"
        fill="#d4b568"
        stroke="#9e823c"
        strokeWidth=".7"
      />
      <path d="M0-26v7m-3-4h6" stroke="#a48744" strokeWidth="1.1" />
      <path d="M0-17C-4-10-5-6-3-2" stroke="#f7e5af" fill="none" />
    </g>
  );
}
export function Landmark({ kind }) {
  if (kind === "baiterek")
    return (
      <g>
        <ellipse cy="9" rx="25" ry="7" fill="#b4c5e0" />
        <path
          d="M-17 5Q-5-20-13-48M17 5Q5-20 13-48M-8 6V-43M8 6V-43M0 5v-51"
          fill="none"
          stroke="#f8fbff"
          strokeWidth="3"
        />
        <path
          d="M-15-35 12-12M15-35-12-12M-11-18 11-3M11-18-11-3"
          fill="none"
          stroke="#9bb4d8"
          strokeWidth="1"
        />
        <circle
          cy="-51"
          r="15"
          fill="#d9b75f"
          stroke="#ab8d45"
          strokeWidth="1"
        />
        <path
          d="M-11-57Q0-66 10-55M-13-49h26M0-66Q-10-51 0-36M0-66Q10-51 0-36"
          fill="none"
          stroke="#f6e7b7"
          strokeWidth="1"
        />
        <ellipse cy="6" rx="19" ry="4" fill="#f2f7ff" stroke="#8aa4c8" />
      </g>
    );
  if (kind === "khan")
    return (
      <g>
        <ellipse cy="8" rx="38" ry="9" fill="#8ba7d3" opacity=".3" />
        <path
          d="M-38 1Q-18-11 9-62 16-17 36 1Q0 16-38 1"
          fill="#dce8fa"
          stroke="#718cb5"
        />
        <path
          d="M9-62 7 9M9-62-24 6M9-62 24 6M9-62-9 9"
          stroke="#fff"
          fill="none"
          strokeWidth="1.5"
        />
        <path d="M9-62 36 1 7 9Z" fill="#9bb9e1" opacity=".6" />
        <path d="m9-62 1-9" stroke="#546f97" strokeWidth="2" />
        <path
          d="M-35 2Q0 17 34 2"
          fill="none"
          stroke="#f8fbff"
          strokeWidth="3"
        />
      </g>
    );
  if (kind === "museum")
    return (
      <g>
        <ellipse cy="9" rx="39" ry="8" fill="#8fa6c8" opacity=".3" />
        <path d="M-35-17h60V7h-60Z" fill="#c3a186" stroke="#866d5d" />
        <path d="m25-17 12-7V0L25 7" fill="#9f816c" stroke="#866d5d" />
        <path
          d="m-39-18 13-20 47-2 19 16-15 9Z"
          fill="#7daa9b"
          stroke="#537d71"
        />
        <path d="m-26-38 11 18 40 5M-39-18l64 3" fill="none" stroke="#c3e3d8" />
        {[-28, -13, 2, 17].map((x) => (
          <g key={x}>
            <rect
              x={x}
              y="-11"
              width="8"
              height="13"
              rx=".8"
              fill="#7192a9"
              stroke="#faf8e9"
              strokeWidth="2"
            />
            <path
              d={`m${x - 1}-14 5-3 5 3M${x + 4}-11V2`}
              fill="none"
              stroke="#fff9e7"
            />
          </g>
        ))}
        <path d="M-35 7h60" stroke="#f1f4f8" strokeWidth="4" />
      </g>
    );
  const historic = kind === "constantine";
  return (
    <g transform={historic ? "scale(.9)" : "scale(1)"}>
      <ellipse cy="9" rx="36" ry="8" fill="#8fa6c8" opacity=".3" />
      <path
        d="M-29-17h58V6h-58Z"
        fill={historic ? "#f4e2b4" : "#f7fbff"}
        stroke="#8198b5"
      />
      <path
        d="M-14-38h28V6h-28Z"
        fill={historic ? "#f4e2b4" : "#f7fbff"}
        stroke="#8198b5"
      />
      <path
        d="M-32 -17 L-22 -29 L-11 -17 Z M11 -17 L22 -29 L32 -17 Z M-17 -38 L0 -50 L17 -38 Z"
        fill="#6c95ce"
        stroke="#5076b0"
      />
      {[-24, 24].map((x) => (
        <g key={x}>
          <rect
            x={x - 4}
            y="-36"
            width="8"
            height="10"
            fill="#f7f7ec"
            stroke="#8198b5"
          />
          <Dome x={x} y={-36} scale={0.57} />
        </g>
      ))}
      {[-10, 10].map((x) => (
        <Dome key={x} x={x} y={-41} scale={0.45} />
      ))}
      <rect
        x="-6"
        y="-54"
        width="12"
        height="11"
        fill="#fbf9ea"
        stroke="#8198b5"
      />
      <Dome y={-54} scale={0.83} />
      {[-22, -9, 9, 22].map((x) => (
        <path key={x} d={`M${x - 2} -6v-9a2 2 0 0 1 4 0v9Z`} fill="#839dc2" />
      ))}
      <path d="M-5 6V-5a5 5 0 0 1 10 0V6" fill="#567496" />
      <path d="M-11 7h22m-26 3h30" stroke="#cedbed" strokeWidth="2" />
    </g>
  );
}
export function Upgrade({ id }) {
  if (id === "M4" || id === "M6")
    return (
      <g>
        <ellipse rx="23" ry="9" fill="#a9d6b9" stroke="#5f9e7e" />
        <path d="m-17 1 31-4" stroke="#eef5d5" strokeWidth="3" />
        <Tree x={-12} y={0} scale={0.65} />
        <Tree x={2} y={-3} scale={0.8} />
        <Tree x={15} y={3} scale={0.55} />
      </g>
    );
  if (id === "M7" || id === "M8")
    return (
      <g>
        <path d="M-18 5v-23h30V5Z" fill="#fff" stroke="#7396c9" />
        <path d="m12-18 8-5V0l-8 5Z" fill="#bad1f1" stroke="#7396c9" />
        <path d="m-21-18 17-10 19 10Z" fill="#5480c8" />
        <path
          d="M-13-10h6m-6 6h6m8-6h6m-6 6h6"
          stroke="#90b3df"
          strokeWidth="3"
        />
        <rect x="-5" y="-1" width="6" height="6" fill="#5b86c8" />
        {id === "M8" ? (
          <path d="M-2-26v10m-5-5h10" stroke="#2c8e91" strokeWidth="3" />
        ) : (
          <path d="M-4-28v-13l12 4-12 4" stroke="#426fde" fill="#7fa3ff" />
        )}
      </g>
    );
  if (id === "M9")
    return (
      <g>
        <path d="m-23-8 33-9 13 19-33 9Z" fill="#80bca5" stroke="#eafff5" />
        <path
          d="m-7-12 13 20m-24-12 25-6 9 12-25 6Z"
          fill="none"
          stroke="#edf9f1"
        />
        <ellipse rx="5" ry="3" fill="none" stroke="white" />
      </g>
    );
  if (id === "M10")
    return (
      <g>
        <path d="M0 6v-30h12" fill="none" stroke="#5b7293" strokeWidth="2" />
        <path d="m7-23-12 26h30L15-23Z" fill="#ffe4a0" opacity=".55" />
        <rect x="6" y="-26" width="12" height="4" rx="2" fill="#e1c376" />
        <rect x="-5" y="-19" width="8" height="4" fill="#3d659e" />
      </g>
    );
  if (id === "M2")
    return (
      <g>
        <path d="M0 5v-22" stroke="#546d91" strokeWidth="2" />
        <rect x="-4" y="-29" width="8" height="19" rx="2" fill="#27394f" />
        <circle cy="-24" r="2" fill="#e1a396" />
        <circle cy="-19" r="2" fill="#dcc482" />
        <circle cy="-14" r="2" fill="#7ce3b1" />
      </g>
    );
  if (id === "M11")
    return (
      <g>
        {[-12, -6, 0, 6, 12].map((x) => (
          <path key={x} d={`m${x}-4 4 8`} stroke="white" strokeWidth="3" />
        ))}
        <path d="M19 4v-19" stroke="#547799" />
        <path d="m12-15 7-11 7 11Z" fill="#c9e7ff" stroke="#4a78c1" />
      </g>
    );
  if (id === "M12")
    return (
      <g>
        <path d="M-7 6v-26H7V6Z" fill="#fff" stroke="#6d93c9" />
        <rect x="-5" y="-22" width="10" height="15" rx="1" fill="#5483dd" />
        <path
          d="m-3-15 2 2 4-5M-9-27q9-9 18 0m-14-3q5-5 10 0"
          stroke="#a1c6ff"
          fill="none"
        />
        <path d="M-3-2h6" stroke="#7d9abf" />
      </g>
    );
  if (id === "M13")
    return (
      <g>
        <path
          d="M-21 2h15v-13h13v13h15"
          fill="none"
          stroke="#6eb4db"
          strokeWidth="5"
        />
        <path
          d="M-21 2h15v-13h13v13h15"
          fill="none"
          stroke="#d8f1ff"
          strokeWidth="1"
        />
        <circle cx="0" cy="-11" r="5" fill="#8ccee9" stroke="#518aad" />
        <path d="M0-15v8m-4-4h8" stroke="#e9faff" />
      </g>
    );
  if (id === "M5")
    return (
      <g>
        <House x={0} y={0} height={18} />
        <path d="M0-24v-8" stroke="#64819d" strokeWidth="4" />
        <path
          d="M0-33C-9-36-5-43 3-46 8-38 5-34 0-33Z"
          fill="#75b99c"
          stroke="#407f6b"
        />
      </g>
    );
  return (
    <g>
      <rect
        x="-19"
        y="-13"
        width="38"
        height="14"
        rx="3"
        fill={id === "M14" ? "#e8f4ff" : "#5486db"}
        stroke="#47699c"
      />
      {[-12, -3, 6].map((x) => (
        <rect
          key={x}
          x={x}
          y="-10"
          width="6"
          height="5"
          rx="1"
          fill="#def1ff"
        />
      ))}
      <circle cx="-11" cy="2" r="3" fill="#3c506a" />
      <circle cx="11" cy="2" r="3" fill="#3c506a" />
      {id === "M14" ? (
        <path d="M-3-15h8" stroke="#e5b96b" strokeWidth="3" />
      ) : id === "M3" ? (
        <path
          d="M-26 8h52m-44-3v6m12-6v6m12-6v6m12-6v6M-8-13l5-6h10"
          stroke="#6685b1"
          fill="none"
        />
      ) : (
        <path d="M-27 7h54" stroke="#7ecee3" strokeWidth="3" />
      )}
    </g>
  );
}
