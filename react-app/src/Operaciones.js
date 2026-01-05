import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

function Operaciones() {
  const navigate = useNavigate();

  const items = [
    { label: "PRENDA", route: "/dashboard/operaciones/prenda" },
    { label: "LIQUIDACIÓN", route: "/dashboard/operaciones/liquidacion" },
    { label: "PAGOS", route: "/dashboard/operaciones/pagos" },
  ];

  return (
    <div
      className="container-fluid d-flex flex-column align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <h2
        className="mb-5 mt-5 text-white"
        style={{ letterSpacing: "2px", color: "white !important" }}
      >
        OPERACIONES
      </h2>
      <div
        className="row justify-content-center w-100"
        style={{ marginTop: "100px" }}
      >
        {items.map((item, idx) => (
          <div
            key={item.label}
            className="col-12 col-md-4 mb-4 d-flex justify-content-center"
          >
            <div
              className="card operaciones-card text-white bg-dark border-light w-100"
              style={{
                borderRadius: "25px",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                minHeight: "150px",
                maxWidth: "300px",
              }}
              onClick={() => navigate(item.route)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.07)";
                e.currentTarget.style.boxShadow = "0 0 20px #00ff99";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                className="card-body d-flex align-items-center justify-content-center"
                style={{ height: "150px" }}
              >
                <h3 className="card-title m-0">{item.label}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Operaciones;
