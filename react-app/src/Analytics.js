import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import "./Analytics.css";

const API_URL = process.env.REACT_APP_API_URL;

const COLORS = {
  bg: "#0f1423",
  text: "#ffffff",
  kpi: "#15224f",
  lineBusquedas: "#2a73ff",
  lineAvances: "#ff9800",
  lineLogins: "#25bd10",
  barClicks: "#6f52ed",
  noData: "#9aa0a6",
};
const PALETTE = ["#25bd10", "#ffc107", "#ef5350", "#42a5f5", "#ab47bc"];

function toNumber(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function titleize(s = "") {
  return s
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/(^|\s)\S/g, (t) => t.toUpperCase());
}

const PIE_COLORS = {
  VIABLE: "#26BD10",
  "VIABLE CON OBSERVACIONES": "#FFDF00",
  "NO VIABLE": "#ff0000",
  OTROS: "#9aa0a6",
};

function buildDateRange(days) {
  const arr = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    arr.push({ dia: iso, logins: 0, busquedas: 0, avances: 0 });
  }
  return arr;
}

const renderPieLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  payload,
}) => {
  const RAD = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.58;
  const x = cx + r * Math.cos(-midAngle * RAD);
  const y = cy + r * Math.sin(-midAngle * RAD);
  const fill = PIE_COLORS[payload.name] || PIE_COLORS.OTROS;
  const textColor = fill === "#FFDF00" ? "#222" : "#fff";
  const p = Math.round(percent * 100);
  if (p < 6) return null;
  return (
    <text
      x={x}
      y={y}
      fill={textColor}
      textAnchor="middle"
      dominantBaseline="central"
      fontWeight="700"
    >
      {p}%
    </text>
  );
};

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [dniRows, setDniRows] = useState([]);
  const [dailyRaw, setDailyRaw] = useState([]);
  const [uiClicksRaw, setUiClicksRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vehiculoSelects, setVehiculoSelects] = useState({
    categorias: [],
    anios: [],
    marcas: [],
    modelos: [],
  });
  const [paso3, setPaso3] = useState({ productos: [], montos: [] });
  const [paso4, setPaso4] = useState({ plazos: [], botones: [] });
  const [loginsPorUsuario, setLoginsPorUsuario] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const [rangeDays, setRangeDays] = useState(30);
  const [clicksFromDate, setClicksFromDate] = useState("");
  const [clicksToDate, setClicksToDate] = useState("");
  const [topN, setTopN] = useState(12);
  const [viabFromDate, setViabFromDate] = useState("");
  const [viabToDate, setViabToDate] = useState("");
  const [dniFromDate, setDniFromDate] = useState("");
  const [dniToDate, setDniToDate] = useState("");
  const [avancesPaso, setAvancesPaso] = useState(0);
  const [paso3FromDate, setPaso3FromDate] = useState("");
  const [paso3ToDate, setPaso3ToDate] = useState("");
  const [paso4FromDate, setPaso4FromDate] = useState("");
  const [paso4ToDate, setPaso4ToDate] = useState("");
  const [loginsFromDate, setLoginsFromDate] = useState("");
  const [loginsToDate, setLoginsToDate] = useState("");
  const [loginsFilterAgencia, setLoginsFilterAgencia] = useState("");
  const [loginsFilterMetodo, setLoginsFilterMetodo] = useState("");
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");

function exportarMetricasExcel() {
  console.log("Exportando métricas...", exportFromDate, exportToDate);
  const params = [];
  if (exportFromDate) params.push(`from=${exportFromDate}`);
  if (exportToDate) params.push(`to=${exportToDate}`);
  params.push("format=excel");
  const url =
    window.location.hostname === "localhost"
      ? `http://localhost:5000/api/export/metricas?${params.join("&")}`
      : `https://api.lever.com.ar/api/export/metricas?${params.join("&")}`;
  window.open(url, "_blank");
}

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const cacheBuster = `?_t=${Date.now()}`;

        const [s, d, dy, ui, vs, p3, p4, av, logins] = await Promise.all([
          fetch(`${API_URL}/api/analytics/summary${cacheBuster}`, {
            credentials: "include",
          }).then((r) => r.json()),
          fetch(`${API_URL}/api/analytics/dni${cacheBuster}`, {
            credentials: "include",
          }).then((r) => r.json()),
          fetch(`${API_URL}/api/analytics/daily${cacheBuster}`, {
            credentials: "include",
          }).then((r) => r.json()),
          fetch(`${API_URL}/api/analytics/ui-clicks${cacheBuster}`, {
            credentials: "include",
          }).then((r) => r.json()),
          fetch(`${API_URL}/api/analytics/vehiculo-selects${cacheBuster}`, {
            credentials: "include",
          }).then((r) => r.json()),
          fetch(`${API_URL}/api/analytics/paso3${cacheBuster}`, {
            credentials: "include",
          }).then((r) => r.json()),
          fetch(`${API_URL}/api/analytics/paso4${cacheBuster}`, {
            credentials: "include",
          }).then((r) => r.json()),
          fetch(`${API_URL}/api/analytics/avances-paso${cacheBuster}`, {
            credentials: "include",
          }).then((r) => r.json()),
          fetch(`${API_URL}/api/analytics/logins-por-usuario${cacheBuster}`, {
            credentials: "include",
            cache: "no-store",
          }).then((r) => r.json()),
        ]);
        if (!active) return;

        console.log("=== LOGINS RESPONSE ===");
        console.log("Total recibido:", logins.logins?.length);
        console.log("Primer registro:", logins.logins?.[0]);

        if (s.success) setSummary(s.summary);
        else setSummary({});
        if (d.success) setDniRows(d.items || []);
        else setDniRows([]);
        if (dy.success) setDailyRaw(dy.items || []);
        else setDailyRaw([]);
        if (ui.success) setUiClicksRaw(ui.items || []);
        else setUiClicksRaw([]);
        if (vs.success) setVehiculoSelects(vs.data);
        else
          setVehiculoSelects({
            categorias: [],
            anios: [],
            marcas: [],
            modelos: [],
          });
        if (p3.success) setPaso3(p3.data);
        else setPaso3({ productos: [], montos: [] });
        if (p4.success) setPaso4(p4.data);
        else setPaso4({ plazos: [], botones: [] });
        if (av.success) setAvancesPaso(av.total);
        else setAvancesPaso(0);

        if (logins.success && logins.logins) {
          console.log("✅ Guardando logins:", logins.logins.length);
          setLoginsPorUsuario(logins.logins);
          setRefreshKey(Date.now());
        } else {
          setLoginsPorUsuario([]);
        }
      } catch (e) {
        setError("No se pudieron cargar las métricas.");
        console.error("Error cargando analytics:", e);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  // ⭐ TODOS LOS USEMEMO ANTES DEL RETURN
  const maxOf = (arr) =>
    arr.reduce((m, i) => Math.max(m, toNumber(i.total)), 0);

  const maxCat = useMemo(
    () => maxOf(vehiculoSelects.categorias),
    [vehiculoSelects],
  );

  const maxYear = useMemo(
    () => maxOf(vehiculoSelects.anios),
    [vehiculoSelects],
  );

  const maxBrand = useMemo(
    () => maxOf(vehiculoSelects.marcas),
    [vehiculoSelects],
  );

  const maxModel = useMemo(
    () => maxOf(vehiculoSelects.modelos),
    [vehiculoSelects],
  );

  const paso4PlazosFiltered = useMemo(() => {
    const filtered = paso4.plazos.filter((p) => {
      if (!p.timestamp) return true;
      const timestamp = p.timestamp.slice(0, 10);
      if (paso4FromDate && timestamp < paso4FromDate) return false;
      if (paso4ToDate && timestamp > paso4ToDate) return false;
      return true;
    });

    const grouped = {};
    filtered.forEach((p) => {
      const key = p.plazo;
      if (!grouped[key]) {
        grouped[key] = { plazo: key, total: 0 };
      }
      grouped[key].total++;
    });

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [paso4.plazos, paso4FromDate, paso4ToDate]);

  const paso4BotonesFiltered = useMemo(() => {
    const filtered = paso4.botones.filter((b) => {
      if (!b.timestamp) return true;
      const timestamp = b.timestamp.slice(0, 10);
      if (paso4FromDate && timestamp < paso4FromDate) return false;
      if (paso4ToDate && timestamp > paso4ToDate) return false;
      return true;
    });

    const grouped = {};
    filtered.forEach((b) => {
      const key = b.label;
      if (!grouped[key]) {
        grouped[key] = { label: key, total: 0 };
      }
      grouped[key].total++;
    });

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [paso4.botones, paso4FromDate, paso4ToDate]);

  const maxPlazoFiltered = useMemo(
    () => maxOf(paso4PlazosFiltered),
    [paso4PlazosFiltered],
  );

  const paso3ProductosFiltered = useMemo(() => {
    const filtered = paso3.productos.filter((p) => {
      if (!p.timestamp) return true;
      const timestamp = p.timestamp.slice(0, 10);
      if (paso3FromDate && timestamp < paso3FromDate) return false;
      if (paso3ToDate && timestamp > paso3ToDate) return false;
      return true;
    });

    const grouped = {};
    filtered.forEach((p) => {
      const key = p.producto;
      if (!grouped[key]) {
        grouped[key] = { producto: key, total: 0 };
      }
      grouped[key].total++;
    });

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [paso3.productos, paso3FromDate, paso3ToDate]);

  const paso3MontosFiltered = useMemo(() => {
    return paso3.montos.filter((m) => {
      if (!m.timestamp) return true;
      const timestamp = m.timestamp.slice(0, 10);
      if (paso3FromDate && timestamp < paso3FromDate) return false;
      if (paso3ToDate && timestamp > paso3ToDate) return false;
      return true;
    });
  }, [paso3.montos, paso3FromDate, paso3ToDate]);

  const montosNumFiltered = useMemo(
    () =>
      paso3MontosFiltered
        .map((m) => Number(String(m.monto || "").replace(/\D/g, "")))
        .filter(Number.isFinite),
    [paso3MontosFiltered],
  );

  const montoStats = useMemo(() => {
    if (!montosNumFiltered.length) return null;
    const sorted = [...montosNumFiltered].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const med =
      sorted.length % 2
        ? sorted[(sorted.length - 1) / 2]
        : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    return {
      count: sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: Math.round(sum / sorted.length),
      med: Math.round(med),
    };
  }, [montosNumFiltered]);

  const daily = useMemo(() => {
    const base = buildDateRange(rangeDays);
    const map = Object.create(null);
    base.forEach((d) => {
      map[d.dia] = d;
    });
    dailyRaw.forEach((row) => {
      const key = (row.dia || "").slice(0, 10);
      if (!map[key]) return;
      map[key].logins += toNumber(row.logins);
      map[key].busquedas += toNumber(row.busquedas);
      map[key].avances += toNumber(row.avances);
    });
    return Object.values(map);
  }, [dailyRaw, rangeDays]);

  const uiClicksFiltered = useMemo(() => {
    const filtered = uiClicksRaw.filter((raw) => {
      if (!raw.timestamp) return false;
      const timestamp = raw.timestamp.slice(0, 10);
      if (clicksFromDate && timestamp < clicksFromDate) return false;
      if (clicksToDate && timestamp > clicksToDate) return false;
      return true;
    });

    const map = {};
    filtered.forEach((r) => {
      const name = titleize(r.boton || "(Sin etiqueta)");
      if (!map[name]) {
        map[name] = { boton: r.boton || "", name, clicks: 0 };
      }
      map[name].clicks += 1;
    });

    const result = Object.values(map);
    result.sort((a, b) => b.clicks - a.clicks);
    return result.slice(0, topN);
  }, [uiClicksRaw, clicksFromDate, clicksToDate, topN]);

  const viabPieFiltered = useMemo(() => {
    const filtered = dniRows.filter((r) => {
      const timestamp = r.timestamp ? r.timestamp.slice(0, 10) : "";
      if (viabFromDate && timestamp < viabFromDate) return false;
      if (viabToDate && timestamp > viabToDate) return false;
      return true;
    });

    const agg = filtered.reduce((acc, r) => {
      const key = (r.viabilidad || "SIN DATOS").toUpperCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const entries = Object.entries(agg).map(([name, value]) => ({
      name,
      value,
      color: PIE_COLORS[name] || PIE_COLORS.OTROS,
    }));
    if (entries.length === 0)
      return [{ name: "SIN DATOS", value: 1, color: PIE_COLORS.OTROS }];
    return entries;
  }, [dniRows, viabFromDate, viabToDate]);

  const dniRowsFiltered = useMemo(() => {
    return dniRows.filter((r) => {
      const timestamp = r.timestamp ? r.timestamp.slice(0, 10) : "";
      if (dniFromDate && timestamp < dniFromDate) return false;
      if (dniToDate && timestamp > dniToDate) return false;
      return true;
    });
  }, [dniRows, dniFromDate, dniToDate]);

  const loginsFiltered = useMemo(() => {
    return loginsPorUsuario.filter((row) => {
      if (row.timestamp) {
        const timestamp = row.timestamp.slice(0, 10);
        if (loginsFromDate && timestamp < loginsFromDate) return false;
        if (loginsToDate && timestamp > loginsToDate) return false;
      }

      if (loginsFilterAgencia && row.agencia !== loginsFilterAgencia) {
        return false;
      }

      if (loginsFilterMetodo && row.metodo !== loginsFilterMetodo) {
        return false;
      }

      return true;
    });
  }, [
    loginsPorUsuario,
    loginsFromDate,
    loginsToDate,
    loginsFilterAgencia,
    loginsFilterMetodo,
  ]);

  const agenciasUnicas = useMemo(() => {
    const set = new Set();
    loginsPorUsuario.forEach((row) => {
      if (row.agencia) set.add(row.agencia);
    });
    return Array.from(set).sort();
  }, [loginsPorUsuario]);

  const formatTimestampLocal = (ts) => {
    if (!ts) return "-";
    const str = String(ts).trim();
    const [fecha, hora] = str.split(" ");
    if (!fecha) return str;
    const [y, m, d] = fecha.split("-");
    return `${d}/${m}/${y}, ${hora}`;
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <h2>Métricas del cotizador</h2>
        <div className="skeleton">Cargando métricas…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="analytics-page">
        <h2>Métricas del cotizador</h2>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <h2>Métricas de web LEVER.COM.AR</h2>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between", // <-- Esto separa los extremos
          gap: 16,
          margin: "32px 0 24px 0",
          padding: 16,
          background: "#232342",
          borderRadius: 16,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <label style={{ fontWeight: 600, color: "#fff" }}>
          Exportar métricas completas:
        </label>
        <label style={{ color: "#fff" }}>Desde:</label>
        <input
          type="date"
          value={exportFromDate}
          onChange={(e) => setExportFromDate(e.target.value)}
          style={{ minWidth: 140 }}
        />
        <label style={{ color: "#fff" }}>Hasta:</label>
        <input
          type="date"
          value={exportToDate}
          onChange={(e) => setExportToDate(e.target.value)}
          style={{ minWidth: 140 }}
        />
        <button
          className="btn btn-primary"
          onClick={exportarMetricasExcel}
          style={{
            minWidth: 180,
            fontWeight: 700,
            fontSize: 16,
            marginLeft: 12,
            padding: "10px 18px",
          }}
        >
          Exportar métricas a Excel
        </button>
      </div>

      <div className="cards">
        <MetricCard
          title="Búsquedas DNI/CUIT"
          value={summary?.total_busquedas || 0}
        />
        <MetricCard title="DNI/CUIT Viables" value={summary?.viables || 0} />
        <MetricCard
          title="DNI/CUIT Con observaciones"
          value={summary?.observados || 0}
        />
        <MetricCard
          title="DNI/CUIT No Viables"
          value={summary?.no_viables || 0}
        />{" "}
      </div>

      {/* GRÁFICO DE TENDENCIA */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3>Tendencia</h3>
        <div className="chart-controls">
          <label>Rango:</label>
          <select
            value={rangeDays}
            onChange={(e) => setRangeDays(Number(e.target.value))}
          >
            <option value={7}>7 días</option>
            <option value={30}>30 días</option>
            <option value={90}>90 días</option>
          </select>
        </div>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={daily}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="#eee" vertical={false} />
            <XAxis
              dataKey="dia"
              tickFormatter={(d) => new Date(d).toLocaleDateString()}
              tick={{ fill: "#657188" }}
            />
            <YAxis tick={{ fill: "#657188" }} />
            <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString()} />
            <Legend />
            <Line
              type="monotone"
              dataKey="busquedas"
              stroke={COLORS.lineBusquedas}
              name="Búsquedas"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="avances"
              stroke={COLORS.lineAvances}
              name="Avances"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="logins"
              stroke={COLORS.lineLogins}
              name="Logins"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
        <div
          style={{ display: "flex", gap: 18, marginTop: 12, marginBottom: 8 }}
        >
          <div style={{ color: "#26BD10", fontWeight: 600 }}>■ VIABLE</div>
          <div style={{ color: "#FFDF00", fontWeight: 600 }}>
            ■ VIABLE CON OBSERVACIONES
          </div>
          <div style={{ color: "#ff0000", fontWeight: 600 }}>■ NO VIABLE</div>
          <div style={{ color: "#9aa0a6", fontWeight: 600 }}>
            ■ OTROS / SIN EVALUAR
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* GRÁFICO DE CLICKS */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <h3>Clicks por botón</h3>
          </div>
          <div className="chart-controls" style={{ marginBottom: "12px" }}>
            <label>Desde:</label>
            <input
              type="date"
              value={clicksFromDate}
              onChange={(e) => setClicksFromDate(e.target.value)}
            />
            <label>Hasta:</label>
            <input
              type="date"
              value={clicksToDate}
              onChange={(e) => setClicksToDate(e.target.value)}
            />
            <label>Cantidad de botones:</label>
            <select
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
            >
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={20}>20</option>
            </select>
          </div>
          <div className="chart-wrapper">
            {uiClicksFiltered.length === 0 ? (
              <div className="empty">Sin datos de clicks aún.</div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height={Math.max(260, uiClicksFiltered.length * 40 + 60)}
              >
                <BarChart
                  data={uiClicksFiltered}
                  layout="vertical"
                  margin={{ top: 8, right: 24, bottom: 8, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    tick={{ fill: "#657188" }}
                    domain={[0, "dataMax + 1"]}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={180}
                    tick={{ fill: "#657188", fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(v) => [v, "Clicks"]}
                    labelFormatter={(l) => l}
                    contentStyle={{
                      backgroundColor: "#1f2740",
                      border: "1px solid #2f3a61",
                      color: "#fff",
                    }}
                  />
                  <Bar
                    dataKey="clicks"
                    name="Clicks"
                    fill="#6f52ed"
                    radius={[6, 6, 6, 6]}
                  >
                    <LabelList
                      dataKey="clicks"
                      position="right"
                      fill="#333"
                      fontWeight={700}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* GRÁFICO DE VIABILIDAD */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <h3>Distribución de viabilidad</h3>
          </div>
          <div className="chart-controls" style={{ marginBottom: "12px" }}>
            <label>Desde:</label>
            <input
              type="date"
              value={viabFromDate}
              onChange={(e) => setViabFromDate(e.target.value)}
            />
            <label>Hasta:</label>
            <input
              type="date"
              value={viabToDate}
              onChange={(e) => setViabToDate(e.target.value)}
            />
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={420}>
              <PieChart>
                <Pie
                  data={viabPieFiltered}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={75}
                  outerRadius={125}
                  paddingAngle={2}
                  labelLine={false}
                  label={renderPieLabel}
                >
                  {viabPieFiltered.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip formatter={(v, n) => [v, titleize(n)]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TABLA DNI */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <div className="analytics-section-title">
          <h3>PASO 1 - DNI/CUIT consultados</h3>
        </div>
        <span className="paso-badge">Paso 1</span>
      </div>
      <div className="chart-controls" style={{ marginBottom: "12px" }}>
        <label>Desde:</label>
        <input
          type="date"
          value={dniFromDate}
          onChange={(e) => setDniFromDate(e.target.value)}
        />
        <label>Hasta:</label>
        <input
          type="date"
          value={dniToDate}
          onChange={(e) => setDniToDate(e.target.value)}
        />
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>DNI/CUIT</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Viabilidad</th>
              <th>Agencia</th>
              <th>Cat.</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {dniRowsFiltered.map((r, i) => (
              <tr key={r.id || i}>
                <td>{r.dni}</td>
                <td>{r.nombre_solicitante}</td>
                <td>{r.tipo_documento}</td>
                <td>{r.viabilidad}</td>
                <td>{r.agencia}</td>
                <td>{r.categoria_usuario}</td>
                <td>{new Date(r.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paso 2: Vehículos */}
      <div className="analytics-section">
        <div className="analytics-section-title">
          <h3>PASO 2 - Análisis de búsqueda de vehículos</h3>
        </div>
        <span className="paso-badge">Paso 2</span>

        <div className="grid-2">
          <div>
            <h3 className="subsection-title">Categorías más consultadas</h3>
            <div className="stat-card">
              <table className="stat-table">
                <thead>
                  <tr>
                    <th>Categoría</th>
                    <th>Consultas</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiculoSelects.categorias.slice(0, 10).map((item, i) => (
                    <tr key={i}>
                      <td>{item.label}</td>
                      <td className="value-cell">
                        <strong>{item.total}</strong>
                        <div className="meter">
                          <span
                            style={{
                              width: `${Math.round(
                                (item.total / (maxCat || 1)) * 100,
                              )}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="subsection-title">Años más consultados</h3>
            <div className="stat-card">
              <table className="stat-table">
                <thead>
                  <tr>
                    <th>Año</th>
                    <th>Consultas</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiculoSelects.anios.slice(0, 10).map((item, i) => (
                    <tr key={i}>
                      <td>{item.label}</td>
                      <td className="value-cell">
                        <strong>{item.total}</strong>
                        <div className="meter">
                          <span
                            style={{
                              width: `${Math.round(
                                (item.total / (maxYear || 1)) * 100,
                              )}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div>
            <h3 className="subsection-title">Top 15 marcas más consultadas</h3>
            <div className="stat-card">
              <table className="stat-table">
                <thead>
                  <tr>
                    <th>Marca</th>
                    <th>Consultas</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiculoSelects.marcas.slice(0, 15).map((item, i) => (
                    <tr key={i}>
                      <td>{item.label}</td>
                      <td className="value-cell">
                        <strong>{item.total}</strong>
                        <div className="meter">
                          <span
                            style={{
                              width: `${Math.round(
                                (item.total / (maxBrand || 1)) * 100,
                              )}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="subsection-title">Top 15 modelos más consultados</h3>
            <div className="stat-card">
              <table className="stat-table">
                <thead>
                  <tr>
                    <th>Modelo</th>
                    <th>Consultas</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiculoSelects.modelos.slice(0, 15).map((item, i) => (
                    <tr key={i}>
                      <td>{item.label}</td>
                      <td className="value-cell">
                        <strong>{item.total}</strong>
                        <div className="meter">
                          <span
                            style={{
                              width: `${Math.round(
                                (item.total / (maxModel || 1)) * 100,
                              )}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Paso 3: Productos y montos */}
      <div className="analytics-section">
        <div className="analytics-section-title">
          <h3>PASO 3 - Productos y montos a financiar</h3>
        </div>
        <span className="paso-badge">Paso 3</span>

        <div className="chart-controls" style={{ marginBottom: "12px" }}>
          <label>Desde:</label>
          <input
            type="date"
            value={paso3FromDate}
            onChange={(e) => setPaso3FromDate(e.target.value)}
          />
          <label>Hasta:</label>
          <input
            type="date"
            value={paso3ToDate}
            onChange={(e) => setPaso3ToDate(e.target.value)}
          />
        </div>

        <div className="grid-2">
          <div>
            <h3 className="subsection-title">Productos más seleccionados</h3>
            <div className="stat-card">
              <table className="stat-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Selecciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paso3ProductosFiltered.map((p, i) => (
                    <tr key={i}>
                      <td>{p.producto}</td>
                      <td className="value-cell">
                        <strong>{p.total}</strong>
                      </td>
                    </tr>
                  ))}
                  {paso3ProductosFiltered.length === 0 && (
                    <tr>
                      <td colSpan={2}>Sin datos aún</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="subsection-title">Montos netos a financiar</h3>
            <div className="stat-card">
              {montoStats ? (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "18px",
                    color: "#15224f",
                    lineHeight: "1.6",
                  }}
                >
                  <li>
                    <strong>Registros:</strong> {montoStats.count}
                  </li>
                  <li>
                    <strong>Promedio:</strong> $
                    {montoStats.avg.toLocaleString()}
                  </li>
                </ul>
              ) : (
                <div className="empty">Sin montos cargados aún.</div>
              )}
              <div
                style={{ marginTop: "14px", maxHeight: 240, overflowY: "auto" }}
              >
                <table className="stat-table">
                  <thead>
                    <tr>
                      <th>Monto</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paso3MontosFiltered.map((m, i) => (
                      <tr key={i}>
                        <td>
                          $
                          {Number(
                            String(m.monto).replace(/\D/g, ""),
                          ).toLocaleString()}
                        </td>
                        <td>
                          {m.timestamp
                            ? new Date(m.timestamp).toLocaleString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                    {paso3MontosFiltered.length === 0 && (
                      <tr>
                        <td colSpan={2}>Sin datos aún</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Paso 4: Plazos y botones */}
      <div className="analytics-section">
        <div className="analytics-section-title">
          <h3>PASO 4 - Opciones de financiamiento</h3>
        </div>
        <span className="paso-badge">Paso 4</span>

        <div className="chart-controls" style={{ marginBottom: "12px" }}>
          <label>Desde:</label>
          <input
            type="date"
            value={paso4FromDate}
            onChange={(e) => setPaso4FromDate(e.target.value)}
          />
          <label>Hasta:</label>
          <input
            type="date"
            value={paso4ToDate}
            onChange={(e) => setPaso4ToDate(e.target.value)}
          />
        </div>

        <div className="grid-2">
          <div>
            <h3 className="subsection-title">Plazos más elegidos</h3>
            <div className="stat-card">
              <table className="stat-table">
                <thead>
                  <tr>
                    <th>Plazo</th>
                    <th>Selecciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paso4PlazosFiltered.slice(0, 15).map((p, i) => (
                    <tr key={i}>
                      <td>{p.plazo}</td>
                      <td className="value-cell">
                        <strong>{p.total}</strong>
                        <div className="meter">
                          <span
                            style={{
                              width: `${Math.round(
                                (p.total / (maxPlazoFiltered || 1)) * 100,
                              )}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paso4PlazosFiltered.length === 0 && (
                    <tr>
                      <td colSpan={2}>Sin datos aún</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="subsection-title">
              Botones más usados en pantalla 4
            </h3>
            <div className="stat-card">
              <table className="stat-table">
                <thead>
                  <tr>
                    <th>Botón</th>
                    <th>Clics</th>
                  </tr>
                </thead>
                <tbody>
                  {paso4BotonesFiltered.map((b, i) => (
                    <tr key={i}>
                      <td>{b.label}</td>
                      <td className="value-cell">
                        <strong>{b.total}</strong>
                      </td>
                    </tr>
                  ))}
                  {paso4BotonesFiltered.length === 0 && (
                    <tr>
                      <td colSpan={2}>Sin datos aún</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ⭐ SECCIÓN LOGINS */}
      <div className="analytics-section">
        <div className="analytics-section-title">
          <h3>Logins por usuario ({loginsFiltered.length} registros)</h3>
        </div>

        <div className="chart-controls" style={{ marginBottom: "12px" }}>
          <label>Desde:</label>
          <input
            type="date"
            value={loginsFromDate}
            onChange={(e) => setLoginsFromDate(e.target.value)}
          />
          <label>Hasta:</label>
          <input
            type="date"
            value={loginsToDate}
            onChange={(e) => setLoginsToDate(e.target.value)}
          />
          <label>Agencia:</label>
          <select
            value={loginsFilterAgencia}
            onChange={(e) => setLoginsFilterAgencia(e.target.value)}
          >
            <option value="">Todas</option>
            {agenciasUnicas.map((agencia) => (
              <option key={agencia} value={agencia}>
                {agencia}
              </option>
            ))}
          </select>
          <label>Método:</label>
          <select
            value={loginsFilterMetodo}
            onChange={(e) => setLoginsFilterMetodo(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="google_one_tap">Google One Tap</option>
            <option value="email_password">Email/Contraseña</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Agencia</th>
                <th>Método</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {loginsFiltered.length > 0 ? (
                loginsFiltered.map((row, i) => (
                  <tr key={`${row.email}-${row.timestamp}-${i}`}>
                    <td>{row.email || "(sin email)"}</td>
                    <td>{row.agencia || "Sin agencia"}</td>
                    <td>
                      {row.metodo === "google_one_tap"
                        ? "Google One Tap"
                        : row.metodo === "email_password"
                          ? "Email/Contraseña"
                          : "Desconocido"}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {formatTimestampLocal(row.timestamp)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>
                    Sin datos de logins con esos filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value }) {
  return (
    <div className="metric-card">
      <p>{title}</p>
      <h3>{value}</h3>
    </div>
  );
}
