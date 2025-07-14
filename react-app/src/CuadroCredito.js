import React, { useState } from 'react';
import { calcularFrances } from './FrancesSimulador';

function calcularCuadroExcel({
  capitalNeto,
  plazo,
  tna,
  comisionPorc,
  tipoPersona,
  abonaSellado,
  exento
}) {
  const minimoConIVA = 200000 * 1.21;
  // --- CAMBIO CLAVE AQUÍ ---
  // Si comisionPorc es 7.00, debe usarse 0.07 para el cálculo
  // Si ya es 0.07, no dividir de nuevo
  // Para debug: console.log(comisionPorc)
  let comisionPorcDecimal = comisionPorc;
  if (comisionPorc > 1.2) { // Si es 7, 7.00, 7.775, etc.
    comisionPorcDecimal = comisionPorc / 100;
  }
  // El cálculo correcto es capitalNeto * comisionPorcDecimal * 1.21
  const montoComisionConIVA = capitalNeto * comisionPorcDecimal * 1.21;
  const comisionConIVA = montoComisionConIVA;
  const gastoConIVA = Math.max(comisionConIVA, minimoConIVA);
  const conGasto = capitalNeto + gastoConIVA;

  // Cuota pura (sin IVA, sin seguro)
  // ATENCIÓN: el cálculo correcto de cuota pura del sistema francés es:
  // cuotaPura = (tasaMensual * conGasto) / (1 - Math.pow(1 + tasaMensual, -plazo))
  const tasaMensual = tna / 12;
  const cuotaPura = (tasaMensual * conGasto) / (1 - Math.pow(1 + tasaMensual, -plazo));

  // SELLADO
  let sellado = 0;
  if (tipoPersona === 'juridica') {
    // Si es persona jurídica y sellado NO, el valor es 0
    sellado = (!abonaSellado || exento) ? 0 : conGasto * 0.005;
  } else {
    sellado = abonaSellado ? cuotaPura * plazo * 0.005 : 0;
  }
  const capitalBruto = conGasto + sellado;

  // Calcular cuotas usando el sistema francés
  let cuotaInicialIVA = 0;
  let cuotaPuraSinIVA = 0;
  let cuotaPromedioIVA = 0;
  try {
    // Usar capitalBruto como capitalInicial para el sistema francés
    const francesRows = calcularFrances({
      capitalInicial: capitalBruto, // <-- Usar capitalBruto, no conGasto
      plazo,
      tna: Number((tna * 100).toFixed(1)),
      ivaInteres: 0.21
    });
    if (francesRows && francesRows.length > 0) {
      cuotaInicialIVA = francesRows[0].cuotaConIVA || 0;
      cuotaPuraSinIVA = francesRows[0].cuotaSinIVA || 0;
      cuotaPromedioIVA = francesRows
        .slice(0, plazo)
        .reduce((acc, r) => acc + (r.cuotaConIVA || 0), 0) / plazo;
    }
  } catch (e) {
    // Si hay error, dejar los valores en 0
  }

  const montoPrenda = cuotaPuraSinIVA * plazo;
  // Elimina cualquier cálculo anterior de montoComisionConIVA que use 0.07775 o 7.775
  // El valor correcto es el calculado arriba con comisionPorcDecimal
  const montoPercibir = capitalBruto - Math.max(montoComisionConIVA, minimoConIVA) - sellado;

  return {
    capitalNeto,
    gastoConIVA,
    conGasto,
    cuotaPura,
    capitalBruto,
    plazo,
    tna: Number((tna * 100).toFixed(1)), // <-- Solo un decimal, ej: 53.9
    cuotaInicialIVA,
    cuotaPuraSinIVA,
    cuotaPromedioIVA,
    montoPrenda,
    sellado,
    comisionPorc,
    montoComisionConIVA,
    minimoConIVA,
    montoPercibir
  };
}

const opciones = [
  { nombre: "OPCIÓN A", plazo: 24 },
  { nombre: "OPCIÓN B", plazo: 36 },
  { nombre: "OPCIÓN C", plazo: 48 }
];

export default function CuadroCredito({
  capitalNeto: capitalNetoProp = 1000000,
  tna = 0.539,
  comisionPorc = 7.00, // Valor por defecto 7.00
  tipoPersona = 'fisica',
  abonaSellado: abonaSelladoProp = false,
  exento = false
}) {
  const [capitalNeto, setCapitalNeto] = useState(capitalNetoProp);
  const [abonaSellado, setAbonaSellado] = useState(abonaSelladoProp);
  const [tipoPersonaState, setTipoPersonaState] = useState(tipoPersona);
  // Estados para % comisión y TNA de cada opción, inicializados en 7.00
  const [comisionPorcA, setComisionPorcA] = useState(7.00);
  const [comisionPorcB, setComisionPorcB] = useState(7.00);
  const [comisionPorcC, setComisionPorcC] = useState(7.00);
  const [tnaA, setTnaA] = useState(tna);
  const [tnaB, setTnaB] = useState(tna);
  const [tnaC, setTnaC] = useState(tna);

  // Helpers para obtener el valor según columna
  const getComisionPorc = idx => {
    if (idx === 0) return comisionPorcA;
    if (idx === 1) return comisionPorcB;
    if (idx === 2) return comisionPorcC;
    return 7.00;
  };
  const getTna = idx => {
    if (idx === 0) return tnaA;
    if (idx === 1) return tnaB;
    if (idx === 2) return tnaC;
    return tna;
  };

  return (
    <div className="card mb-4">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-bordered mb-0 text-center align-middle">
            <thead className="table-light">
              <tr>
                <th></th>
                {opciones.map((op, idx) => (
                  <th key={idx} className="fw-bold">{op.nombre}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="fw-bold">CAPITAL SOLICITADO NETO</td>
                {opciones.map((op, idx) => (
                  <td key={idx} className="small-table-text" style={{ minWidth: 180 }}>
                    {idx === 0 ? (
                      <input
                        type="number"
                        className="form-control"
                        style={{ width: 140, margin: '0 auto', textAlign: 'right' }}
                        value={capitalNeto}
                        min={0}
                        onChange={e => setCapitalNeto(Number(e.target.value))}
                      />
                    ) : (
                      `$${Number(capitalNeto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                    )}
                  </td>
                ))}
              </tr>
              {[
                { label: "Gasto con IVA", key: "gastoConIVA", format: v => `$${Number(v).toLocaleString('es-AR', {minimumFractionDigits:2})}` },
                { label: "Con Gasto", key: "conGasto", format: v => `$${Number(v).toLocaleString('es-AR', {minimumFractionDigits:2})}` },
                { label: "Cuota pura", key: "cuotaPura", format: v => `$${Number(Math.round(v)).toLocaleString('es-AR', {minimumFractionDigits:2, maximumFractionDigits:2})}` },
                { label: "CAPITAL BRUTO", key: "capitalBruto", format: v => `$ ${Number(Math.round(v)).toLocaleString('es-AR')}` },
                { label: "PLAZO", key: "plazo", format: v => v },
                { label: "TNA", key: "tna", format: (v, idx) => (
                    <input
                      type="number"
                      className="form-control"
                      style={{ width: 90, margin: '0 auto', textAlign: 'right' }}
                      value={Number(getTna(idx) * 100).toFixed(1)} // <-- Mostrar solo un decimal
                      min={0}
                      step={0.01}
                      onChange={e => {
                        const val = Number(e.target.value.replace(',', '.')) / 100;
                        if (idx === 0) setTnaA(val);
                        if (idx === 1) setTnaB(val);
                        if (idx === 2) setTnaC(val);
                      }}
                    />
                  ) },
                { label: "CUOTA INICIAL APROXIMADA (IVA INC) S/SEGURO", key: "cuotaInicialIVA", format: v => `$${Number(v).toLocaleString('es-AR', {minimumFractionDigits:2})}` },
                { label: "CUOTA PURA (SIN IVA, SIN SEGURO)", key: "cuotaPuraSinIVA", format: v => `$${Number(v).toLocaleString('es-AR', {minimumFractionDigits:2})}` },
                { label: "CUOTA PROMEDIO (IVA INCLUIDO) SIN SEGURO", key: "cuotaPromedioIVA", format: v => `$${Number(v).toLocaleString('es-AR', {minimumFractionDigits:2})}` },
                { label: "Monto de la Prenda", key: "montoPrenda", format: v => `$${Number(v).toLocaleString('es-AR', {minimumFractionDigits:2})}` },
                {
                  // Ahora solo mostramos el valor de sellado, sin select.
                  label: "Sellado",
                  key: "sellado",
                  format: v => `$${Number(v).toLocaleString('es-AR', {minimumFractionDigits:2, maximumFractionDigits:2})}`
                },
                
                {
                  label: "% COMISIÓN OTORGAMIENTO",
                  key: "comisionPorc",
                  format: (v, idx) => (
                    <input
                      type="number"
                      className="form-control"
                      style={{ width: 90, margin: '0 auto', textAlign: 'right' }}
                      value={getComisionPorc(idx).toFixed(2)} // <-- Siempre mostrar dos decimales, ej: 7.00
                      min={0}
                      step={0.01}
                      onChange={e => {
                        const val = Number(e.target.value);
                        if (idx === 0) setComisionPorcA(val);
                        if (idx === 1) setComisionPorcB(val);
                        if (idx === 2) setComisionPorcC(val);
                      }}
                    />
                  )
                },
                {
                  label: "MONTO DE COMISIÓN C/IVA",
                  key: "montoComisionConIVA",
                  format: (v) => `$${Number(v).toLocaleString('es-AR', {minimumFractionDigits:2, maximumFractionDigits:2})}`
                },
                { label: "MÍNIMO", key: "minimoConIVA", format: v => `$${Number(v).toLocaleString('es-AR', {minimumFractionDigits:2})}` },
                { label: "MONTO A PERCIBIR", key: "montoPercibir", format: v => `$${Number(v).toLocaleString('es-AR', {minimumFractionDigits:2})}` }
              ].map(row => (
                <tr key={row.key}>
                  <td className="fw-bold">{row.label}</td>
                  {opciones.map((op, idx) => {
                    // Si es la fila del select de persona, solo mostrar el select en la primera columna
                    if (row.key === "persona_select") {
                      return (
                        <td key={idx} className="small-table-text">
                          {idx === 0 ? row.format() : ""}
                        </td>
                      );
                    }
                    const datos = calcularCuadroExcel({
                      capitalNeto: capitalNeto ? Number(capitalNeto) : 0,
                      plazo: op.plazo,
                      tna: getTna(idx),
                      comisionPorc: getComisionPorc(idx),
                      tipoPersona: tipoPersonaState,
                      abonaSellado,
                      exento
                    });
                    // Si la fila es editable, pasar idx
                    if (row.key === "comisionPorc" || row.key === "tna") {
                      return (
                        <td key={idx} className="small-table-text">{row.format(datos[row.key], idx)}</td>
                      );
                    }
                    return (
                      <td key={idx} className="small-table-text">{row.format(datos[row.key], idx)}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}