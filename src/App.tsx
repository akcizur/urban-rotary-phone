import { useMemo, useState } from "react";
import type { Movement, MovementType, StockPack } from "./types";
import { initialSnapshot } from "./data";
import { loadSnapshot, resetSnapshot, saveSnapshot } from "./storage";

const positions = ["1RL", "1RP", "2RL", "2RP", "3RL", "3RP", "4RL", "4RP", "Pal 4", "Pal 6", "Míchárna"];

const fmt = new Intl.NumberFormat("cs-CZ");
const dateFmt = new Intl.DateTimeFormat("cs-CZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function App() {
  const [snapshot, setSnapshot] = useState(loadSnapshot);
  const [view, setView] = useState<"dashboard" | "inventory" | "movements">("dashboard");
  const [query, setQuery] = useState("");
  const [selectedPack, setSelectedPack] = useState<StockPack | null>(null);
  const [showMove, setShowMove] = useState(false);
  const [notice, setNotice] = useState("");

  const totalWeight = snapshot.packs.reduce((sum, p) => sum + p.weightG, 0);
  const openCount = snapshot.packs.filter((p) => p.status === "otevřený").length;
  const expiringSoon = snapshot.packs.filter((p) => /^(10|11|12)\/26$/.test(p.expiry)).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return snapshot.packs;
    return snapshot.packs.filter((p) =>
      [p.idPack, p.name, p.lot, p.box, p.position, p.expiry].some((v) => v.toLowerCase().includes(q))
    );
  }, [snapshot.packs, query]);

  const fifo = [...snapshot.packs].sort((a, b) => {
    const [am, ay] = a.expiry.split("/").map(Number);
    const [bm, by] = b.expiry.split("/").map(Number);
    return (ay * 12 + am) - (by * 12 + bm);
  })[0];

  function commit(next: typeof snapshot, message?: string) {
    setSnapshot(next);
    saveSnapshot(next);
    if (message) {
      setNotice(message);
      window.setTimeout(() => setNotice(""), 2500);
    }
  }

  function applyMovement(pack: StockPack, type: MovementType, amount: number, note: string, toPosition?: string) {
    if (type === "Výdej" && amount > pack.weightG) {
      setNotice("Výdej převyšuje aktuální zásobu.");
      return;
    }

    const now = new Date().toISOString();
    const delta = type === "Příjem" ? amount : type === "Výdej" ? -amount : 0;
    const nextPack = {
      ...pack,
      weightG: Math.max(0, pack.weightG + delta),
      position: type === "Přesun" && toPosition ? toPosition : pack.position,
      status: type === "Výdej" ? "otevřený" as const : pack.status
    };

    const movement: Movement = {
      id: `M-${Date.now()}`,
      idPack: pack.idPack,
      timestamp: now,
      deltaG: delta,
      type,
      note,
      fromPosition: type === "Přesun" ? pack.position : undefined,
      toPosition: type === "Přesun" ? toPosition : undefined
    };

    commit({
      packs: snapshot.packs.map((p) => p.idPack === pack.idPack ? nextPack : p),
      movements: [movement, ...snapshot.movements]
    }, type === "Přesun" ? "Pohyb uložen" : "Pohyb skladu uložen");

    setSelectedPack(nextPack);
    setShowMove(false);
  }

  function undoLast() {
    const last = snapshot.movements[0];
    if (!last) return;

    const pack = snapshot.packs.find((p) => p.idPack === last.idPack);
    if (!pack) return;

    const restored: StockPack = {
      ...pack,
      weightG: Math.max(0, pack.weightG - last.deltaG),
      position: last.type === "Přesun" && last.fromPosition ? last.fromPosition : pack.position
    };

    commit({
      packs: snapshot.packs.map((p) => p.idPack === pack.idPack ? restored : p),
      movements: snapshot.movements.slice(1)
    }, "Poslední pohyb vrácen");
  }

  function reset() {
    commit(resetSnapshot(), "Demo data obnovena");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">U</span><div><strong>URBAN</strong><small>WAREHOUSE SYSTEM</small></div></div>
        <nav>
          <button className={view === "dashboard" ? "nav-item active" : "nav-item"} onClick={() => setView("dashboard")}><span>01</span> Přehled</button>
          <button className={view === "inventory" ? "nav-item active" : "nav-item"} onClick={() => setView("inventory")}><span>02</span> Sklad</button>
          <button className={view === "movements" ? "nav-item active" : "nav-item"} onClick={() => setView("movements")}><span>03</span> Pohyby</button>
        </nav>
        <div className="sidebar-foot">
          <div className="system-state"><i></i><span>Lokální režim</span><b>READY</b></div>
          <button className="reset" onClick={reset}>Obnovit demo data</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><span className="eyebrow">WMS / LIVE WORKSPACE</span><h1>{view === "dashboard" ? "Přehled skladu" : view === "inventory" ? "Skladové jednotky" : "Historie pohybů"}</h1></div>
          <div className="topbar-actions">
            <div className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Hledat pytel, šarži, pozici..." /></div>
            <button className="primary" onClick={() => { setSelectedPack(snapshot.packs[0]); setShowMove(true); }}>+ Pohyb</button>
          </div>
        </header>

        {notice && <div className="toast">{notice}</div>}

        {view === "dashboard" && (
          <>
            <section className="metric-grid">
              <Metric title="Celkem zásoby" value={`${fmt.format(totalWeight)} g`} meta={`${snapshot.packs.length} pytlů / jednotek`} />
              <Metric title="Otevřené pytle" value={String(openCount)} meta="Vyžadují prioritu při výdeji" />
              <Metric title="Expirace" value={String(expiringSoon)} meta="Šarže s expirací 2026" danger />
              <Metric title="Pohyby dnes" value={String(snapshot.movements.length)} meta="Auditní historie zachována" />
            </section>

            <section className="dashboard-grid">
              <div className="panel map-panel">
                <div className="panel-head"><div><span className="eyebrow">LOCATION MAP</span><h2>2D skladová mapa</h2></div><span className="muted">A / D · 10 řad</span></div>
                <div className="warehouse-grid">
                  {positions.map((pos) => {
                    const items = snapshot.packs.filter((p) => p.position === pos);
                    return <button key={pos} className={items.length ? "slot occupied" : "slot"} onClick={() => items[0] && setSelectedPack(items[0])}>
                      <b>{pos}</b><span>{items.length ? `${items.length}×` : "·"}</span>
                    </button>;
                  })}
                </div>
                <div className="legend"><span><i className="dot filled"></i> Obsazeno</span><span><i className="dot"></i> Volné</span></div>
              </div>

              <div className="panel fifo-panel">
                <div className="panel-head"><div><span className="eyebrow">FIFO / RECOMMENDATION</span><h2>První na výdej</h2></div></div>
                {fifo && <button className="fifo-card" onClick={() => setSelectedPack(fifo)}>
                  <div className="fifo-index">01</div>
                  <div><strong>{fifo.name}</strong><span>{fifo.idPack} · šarže {fifo.lot}</span><small>Expirace {fifo.expiry} · {fifo.position}</small></div>
                  <b>{fmt.format(fifo.weightG)} g</b>
                </button>}
                <div className="warning"><strong>Pozor na výdej</strong><span>Systém zastaví výdej nad dostupné množství a uloží každý pohyb do auditu.</span></div>
              </div>
            </section>

            <section className="panel table-panel">
              <div className="panel-head"><div><span className="eyebrow">CURRENT STOCK</span><h2>Aktuální zásoba</h2></div><button className="ghost" onClick={() => setView("inventory")}>Zobrazit sklad →</button></div>
              <InventoryTable packs={filtered.slice(0, 5)} onSelect={setSelectedPack} />
            </section>
          </>
        )}

        {view === "inventory" && (
          <section className="panel table-panel full-panel">
            <div className="panel-head"><div><span className="eyebrow">INVENTORY</span><h2>{filtered.length} záznamů</h2></div><span className="muted">Lokální data / adapter ready</span></div>
            <InventoryTable packs={filtered} onSelect={setSelectedPack} />
          </section>
        )}

        {view === "movements" && (
          <section className="panel table-panel full-panel">
            <div className="panel-head"><div><span className="eyebrow">AUDIT LOG</span><h2>{snapshot.movements.length} pohybů</h2></div><button className="ghost" onClick={undoLast}>↶ Vrátit poslední</button></div>
            <div className="movement-list">
              {snapshot.movements.map((m) => <div className="movement-row" key={m.id}>
                <div className={m.deltaG < 0 ? "movement-sign negative" : "movement-sign"}>{m.type === "Přesun" ? "↔" : m.deltaG > 0 ? "+" : "−"}</div>
                <div className="movement-main"><strong>{m.type}</strong><span>{m.idPack} · {m.note}</span></div>
                <div className="movement-pos">{m.type === "Přesun" ? `${m.fromPosition} → ${m.toPosition}` : `${Math.abs(m.deltaG)} g`}</div>
                <time>{dateFmt.format(new Date(m.timestamp))}</time>
              </div>)}
            </div>
          </section>
        )}
      </main>

      {selectedPack && <PackInspector pack={selectedPack} onClose={() => setSelectedPack(null)} onMove={() => setShowMove(true)} movements={snapshot.movements.filter((m) => m.idPack === selectedPack.idPack)} />}
      {showMove && selectedPack && <MoveModal pack={selectedPack} onClose={() => setShowMove(false)} onApply={applyMovement} />}
    </div>
  );
}

function Metric({ title, value, meta, danger = false }: { title: string; value: string; meta: string; danger?: boolean }) {
  return <div className={danger ? "metric danger" : "metric"}><span>{title}</span><strong>{value}</strong><small>{meta}</small></div>;
}

function InventoryTable({ packs, onSelect }: { packs: StockPack[]; onSelect: (pack: StockPack) => void }) {
  return <div className="table-wrap"><table><thead><tr><th>Pytel</th><th>Surovina</th><th>Šarže</th><th>Exp.</th><th>Box</th><th>Pozice</th><th>Zásoba</th><th>Stav</th></tr></thead><tbody>
    {packs.map((p) => <tr key={p.idPack} onClick={() => onSelect(p)}><td><b>{p.idPack}</b></td><td>{p.name}</td><td>{p.lot}</td><td>{p.expiry}</td><td>{p.box}</td><td>{p.position}</td><td>{fmt.format(p.weightG)} g</td><td><span className="status">{p.status}</span></td></tr>)}
  </tbody></table></div>;
}

function PackInspector({ pack, movements, onClose, onMove }: { pack: StockPack; movements: Movement[]; onClose: () => void; onMove: () => void }) {
  return <div className="overlay"><aside className="inspector">
    <div className="inspector-head"><div><span className="eyebrow">PACK DETAIL</span><h2>{pack.idPack}</h2></div><button className="icon-btn" onClick={onClose}>×</button></div>
    <div className="hero-value"><strong>{fmt.format(pack.weightG)}</strong><span>g aktuálně</span></div>
    <div className="detail-grid">{[["Surovina", pack.name], ["Šarže", pack.lot], ["Expirace", pack.expiry], ["Box", pack.box], ["Pozice", pack.position], ["Stav", pack.status]].map(([k,v]) => <div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div>
    <button className="primary wide" onClick={onMove}>Zapsat pohyb</button>
    <div className="inspector-log"><span className="eyebrow">HISTORY</span>{movements.length ? movements.map(m => <div key={m.id}><b>{m.type}</b><span>{m.deltaG ? `${m.deltaG > 0 ? "+" : ""}${m.deltaG} g` : `${m.fromPosition} → ${m.toPosition}`}</span></div>) : <p>Bez historie.</p>}</div>
  </aside></div>;
}

function MoveModal({ pack, onClose, onApply }: { pack: StockPack; onClose: () => void; onApply: (pack: StockPack, type: MovementType, amount: number, note: string, toPosition?: string) => void }) {
  const [type, setType] = useState<MovementType>("Výdej");
  const [amount, setAmount] = useState(String(Math.min(500, pack.weightG)));
  const [note, setNote] = useState("Výdej do výroby");
  const [toPosition, setToPosition] = useState(pack.position);

  return <div className="modal-backdrop"><form className="modal" onSubmit={(e) => { e.preventDefault(); onApply(pack, type, Number(amount) || 0, note || "Bez poznámky", toPosition); }}>
    <div className="modal-head"><div><span className="eyebrow">STOCK ACTION</span><h2>{pack.idPack}</h2></div><button type="button" className="icon-btn" onClick={onClose}>×</button></div>
    <div className="segmented">{(["Výdej", "Příjem", "Přesun"] as MovementType[]).map(t => <button type="button" key={t} className={type === t ? "selected" : ""} onClick={() => setType(t)}>{t}</button>)}</div>
    {type !== "Přesun" ? <label>Množství (g)<input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} /></label> : <label>Nová pozice<select value={toPosition} onChange={e => setToPosition(e.target.value)}>{positions.map(p => <option key={p}>{p}</option>)}</select></label>}
    <label>Poznámka<input value={note} onChange={e => setNote(e.target.value)} /></label>
    <div className="modal-foot"><span>Aktuálně {fmt.format(pack.weightG)} g</span><button className="primary" type="submit">Uložit pohyb</button></div>
  </form></div>;
}

export default App;