"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/format";
import { GAMES } from "@/lib/games";
import { seededScores, type ScoreRow } from "@/lib/scores";

const TOP_CLASS = ["top1", "top2", "top3"];

function PodiumSlot({ row, tier }: { row: ScoreRow; tier: "gold" | "silver" | "bronze" }) {
  const isGold = tier === "gold";
  return (
    <div className={"podium-slot " + tier}>
      {isGold && (
        <div className="pixel" style={{ fontSize: 9, color: "var(--gold)", letterSpacing: "0.18em" }}>
          CAMPEÓN
        </div>
      )}
      <div className="rank-num" style={isGold ? { fontSize: 36, marginTop: 4 } : undefined}>
        {String(row.rank).padStart(2, "0")}
      </div>
      <div className="name">{row.name}</div>
      <div className="score" style={isGold ? { fontSize: 20 } : undefined}>
        {formatNumber(row.score)}
      </div>
      <div className="date">{row.date}</div>
    </div>
  );
}

export function HallOfFame() {
  const [tab, setTab] = useState(GAMES[0].id);
  const rows = seededScores(tab.length * 23 + 7, 12);

  return (
    <>
      <div className="hall-tabs">
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            className={"chip" + (tab === g.id ? " active" : "")}
            onClick={() => setTab(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>

      <div className="podium">
        <PodiumSlot row={rows[1]} tier="silver" />
        <PodiumSlot row={rows[0]} tier="gold" />
        <PodiumSlot row={rows[2]} tier="bronze" />
      </div>

      <div className="hall-table">
        <div className="th">
          <div>RANGO</div>
          <div>JUGADOR</div>
          <div>PUNTUACIÓN</div>
          <div>FECHA</div>
        </div>
        {rows.map((r, i) => (
          // La key incluye la pestaña para que la animación de entrada se repita al cambiar de juego.
          <div
            key={tab + r.rank}
            className={"tr" + (TOP_CLASS[i] ? " " + TOP_CLASS[i] : "")}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
            <div className="pl">{r.name}</div>
            <div className="sc">{formatNumber(r.score)}</div>
            <div className="dt">{r.date}</div>
          </div>
        ))}
      </div>
    </>
  );
}
