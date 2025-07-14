import React, { useState, useEffect } from 'react';

function calcularFrances({ capitalInicial, plazo, tna, ivaInteres }) {
    // TEM: Tasa Efectiva Mensual (aprox. tna/12 si es simple)
    const TEM = tna / 12 / 100;
    const cuotaSinIVA = capitalInicial * ((TEM * Math.pow(1 + TEM, plazo)) / (Math.pow(1 + TEM, plazo) - 1));
    let saldo = capitalInicial;
    let amortizacionAcumulada = 0;
    const rows = [];

    for (let mes = 1; mes <= plazo; mes++) {
        const interes = saldo * TEM;
        const iva = interes * ivaInteres;
        const cuotaConIVA = cuotaSinIVA + iva;
        const amortizacion = cuotaSinIVA - interes;
        amortizacionAcumulada += amortizacion;
        saldo -= amortizacion;
        rows.push({
            mes,
            capital: saldo + amortizacion,
            interes,
            iva,
            cuotaSinIVA,
            cuotaConIVA,
            amortizacion,
            amortizacionAcumulada,
            saldo: saldo < 0.01 ? 0 : saldo // para evitar decimales negativos
        });
    }
    return rows;
}

export default function FrancesSimulador() {
    const [capital, setCapital] = useState(1000000);
    const [plazo, setPlazo] = useState(24);
    const [tna, setTna] = useState(53.9);
    const [ivaInteres, setIvaInteres] = useState(0.21);
    const [rows, setRows] = useState([]);
    const [capitalBruto, setCapitalBruto] = useState(0);

    useEffect(() => {
        // Cálculo de capital bruto igual que en CuadroCredito.js
        const comisionPorc = 7.00;
        const tnaDecimal = Number(tna) / 100;
        const capitalNeto = Number(capital);
        const plazoNum = Number(plazo);
        const tipoPersona = 'fisica';
        const abonaSellado = false;
        const exento = false;
        const minimoConIVA = 200000 * 1.21;
        const comisionConIVA = capitalNeto * (comisionPorc / 100) * 1.21;
        const gastoConIVA = Math.max(comisionConIVA, minimoConIVA);
        const conGasto = capitalNeto + gastoConIVA;
        const tasaMensual = tnaDecimal / 12;
        const cuotaPura = ((tasaMensual) / (1 - Math.pow(1 + tasaMensual, -plazoNum))) * conGasto;
        let sellado = 0;
        if (tipoPersona === 'juridica') {
            sellado = exento ? 0 : conGasto * 0.005;
        } else {
            // La fórmula correcta es: cuotaPura * plazo * 0.005
            sellado = cuotaPura * plazoNum * 0.005;
        }
        const capitalBrutoCalc = conGasto + sellado;
        setCapitalBruto(capitalBrutoCalc);

        // --- Usar CAPITAL BRUTO para el cuadro francés ---
        setRows(
            calcularFrances({
                capitalInicial: capitalBrutoCalc,
                plazo: plazoNum,
                tna: Number(tna),
                ivaInteres: Number(ivaInteres)
            })
        );
    }, [capital, plazo, tna, ivaInteres]);
    
    // Calcular cuota promedio con IVA (PROMEDIO de las primeras N cuotas con IVA)
    let cuotaPromedioIVA = 0;
    if (rows.length && plazo) {
      let startIdx = 0;
      let colIdx = 0;
      // Determinar la columna de cuotas con IVA según el plazo (como en el Excel)
      if (plazo === 24) {
        // Columna G (índice 6)
        colIdx = 6;
      } else if (plazo === 36) {
        // Columna S (índice 18)
        colIdx = 18;
      } else if (plazo === 48) {
        // Columna AD (índice 28)
        colIdx = 28;
      }
      // Si tienes una estructura de filas por plazo, ajusta aquí:
      // Suponiendo que rows es un array de objetos y cada objeto tiene la propiedad cuotaConIVA
      // y que el cuadro mostrado corresponde al plazo seleccionado
      // Si tienes varias tablas, deberías seleccionar la tabla correcta según el plazo
      // Aquí se asume que rows corresponde al plazo seleccionado
      cuotaPromedioIVA = (
        rows.slice(0, plazo).reduce((acc, r) => acc + (r.cuotaConIVA || 0), 0) / plazo
      ).toFixed(2);
    }

    return (
        <div className="container mt-4">
            <h2 style={{ color: '#fff' }}>Simulador Sistema Francés</h2>
            <div className="row mb-3">
                <div className="col-md-3">
                    <label className="form-label" style={{ color: '#fff' }}>CAPITAL</label>
                    <input
                        type="number"
                        className="form-control"
                        value={capital}
                        onChange={e => setCapital(e.target.value)}
                        style={{ color: '#fff', background: '#212529', borderColor: '#444' }}
                    />
                </div>
                {/* Input de Capital Bruto */}
                <div className="col-md-3">
                    <label className="form-label" style={{ color: '#fff' }}>CAPITAL BRUTO</label>
                    <input
                        type="text"
                        className="form-control"
                        value={capitalBruto ? `$${Number(capitalBruto).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                        readOnly
                        style={{ color: '#fff', background: '#212529', borderColor: '#444' }}
                    />
                </div>
                <div className="col-md-3">
                    <label className="form-label" style={{ color: '#fff' }}>PLAZO (meses)</label>
                    <input
                        type="number"
                        className="form-control"
                        value={plazo}
                        onChange={e => setPlazo(e.target.value)}
                        style={{ color: '#fff', background: '#212529', borderColor: '#444' }}
                    />
                </div>
                <div className="col-md-3">
                    <label className="form-label" style={{ color: '#fff' }}>TNA (%)</label>
                    <input
                        type="number"
                        className="form-control"
                        value={tna}
                        onChange={e => setTna(e.target.value)}
                        step="0.01"
                        style={{ color: '#fff', background: '#212529', borderColor: '#444' }}
                    />
                </div>
                <div className="col-md-3">
                    <label className="form-label" style={{ color: '#fff' }}>IVA sobre Interés (%)</label>
                    <input
                        type="number"
                        className="form-control"
                        value={ivaInteres * 100}
                        onChange={e => setIvaInteres(Number(e.target.value) / 100)}
                        step="0.01"
                        style={{ color: '#fff', background: '#212529', borderColor: '#444' }}
                    />
                </div>
            </div>
            {/* Campo adicional: Cuota Promedio (IVA incluido) */}
            <div className="mb-3">
                <label
                    className="form-label fw-bold"
                    style={{ color: '#ffffff' }}
                >
                    Cuota Promedio (IVA incluido)
                </label>
                <input
                    type="text"
                    className="form-control"
                    style={{ color: '#ffffff', background: '#212529' }}
                    value={cuotaPromedioIVA ? `$${Number(cuotaPromedioIVA).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                    readOnly
                />
            </div>
            <div className="table-responsive" style={{ maxHeight: 500, overflowY: 'auto' }}>
                <table className="table table-bordered table-sm text-center align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>Mes</th>
                            <th>Capital</th>
                            <th>Interés</th>
                            <th>IVA</th>
                            <th>Cuota S/IVA</th>
                            <th>Cuota C/IVA</th>
                            <th>Amortización</th>
                            <th>Amort. Acum.</th>
                            <th>Saldo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(r => (
                            <tr key={r.mes}>
                                <td>{r.mes}</td>
                                <td>${r.capital.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                <td>${r.interes.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                <td>${r.iva.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                <td>${r.cuotaSinIVA.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                <td>${r.cuotaConIVA.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                <td>${r.amortizacion.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                <td>${r.amortizacionAcumulada.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                <td>${r.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export { calcularFrances };
