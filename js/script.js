// ===== DOM ELEMENTS =====
const buscador = document.getElementById("buscador");
const resultadosDiv = document.getElementById("resultados");
const estadisticasDiv = document.getElementById("estadisticas");
const estadisticasTexto = document.getElementById("estadisticasTexto");
const searchHint = document.getElementById("searchHint");
const limpiarBtn = document.getElementById("limpiarBtn");
const modeloBadge = document.getElementById("modeloBadge");
// const footerModelo = document.getElementById('footerModelo');

let timeout = null;
let datosGlobales = null;

// ===== CARGAR DATOS =====
async function cargarDatos() {
  try {
    const response = await fetch("data/menus.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    datosGlobales = data;

    // Actualizar modelo en UI
    modeloBadge.innerHTML = `<i class="bi bi-car-front me-1"></i> ${data.modelo || "Modelo no especificado"}`;
    // footerModelo.textContent = data.modelo || 'Modelo no especificado';

    return data;
  } catch (error) {
    console.error("Error cargando datos:", error);
    modeloBadge.innerHTML =
      '<i class="bi bi-exclamation-triangle me-1"></i> Error al cargar datos';
    // footerModelo.textContent = 'Error al cargar';

    resultadosDiv.innerHTML = `
            <div class="text-center py-5">
                <div class="display-1 mb-3">⚠️</div>
                <h5 class="text-secondary">Error al cargar los datos</h5>
                <p class="text-muted small">Verifica que el archivo <strong>data/menus.json</strong> exista</p>
            </div>
        `;
    return null;
  }
}

// ===== BÚSQUEDA RECURSIVA =====
function buscarRecursivo(menu, query, rutaActual = "", nivel = 0) {
  let resultados = [];

  if (typeof menu === "object" && menu !== null && !Array.isArray(menu)) {
    const nombreActual = menu.nombre || "";
    const posicionActual = menu.posicion || "";

    let rutaNueva = rutaActual;
    if (nombreActual) {
      rutaNueva = rutaActual ? `${rutaActual} > ${nombreActual}` : nombreActual;
    }

    if (nombreActual.toLowerCase().includes(query.toLowerCase())) {
      const posicionTexto = posicionActual
        ? `#${posicionActual} en la lista`
        : "Elemento principal";
      resultados.push({
        nombre: nombreActual,
        ruta: rutaNueva || nombreActual,
        posicion: posicionTexto,
        nivel: nivel,
      });
    }

    if (menu.submenus && Array.isArray(menu.submenus)) {
      for (const submenu of menu.submenus) {
        const resultadosSub = buscarRecursivo(
          submenu,
          query,
          rutaNueva || nombreActual,
          nivel + 1,
        );
        resultados = resultados.concat(resultadosSub);
      }
    }
  }

  return resultados;
}

// ===== REALIZAR BÚSQUEDA =====
function realizarBusqueda(query) {
  if (!datosGlobales) {
    resultadosDiv.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-custom mx-auto"></div>
                <p class="text-muted mt-3">Cargando datos...</p>
            </div>
        `;
    return;
  }

  if (!query || query.length < 2) {
    mostrarEstadoVacio();
    estadisticasDiv.style.display = "none";
    return;
  }

  resultadosDiv.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-custom mx-auto"></div>
            <p class="text-muted mt-3">Buscando...</p>
        </div>
    `;

  let resultados = [];
  for (const menu of datosGlobales.menus) {
    const resultadosMenu = buscarRecursivo(menu, query);
    resultados = resultados.concat(resultadosMenu);
  }

  mostrarResultados(resultados, query);
}

// ===== MOSTRAR RESULTADOS =====
function mostrarResultados(resultados, query) {
  if (resultados.length === 0) {
    resultadosDiv.innerHTML = `
            <div class="text-center py-5">
                <div class="display-1 mb-3">🔍</div>
                <h5 class="text-secondary">No se encontraron coincidencias</h5>
                <p class="text-muted">Para "<strong>${escapeHtml(query)}</strong>"</p>
                <p class="text-muted small mt-2">
                    <i class="bi bi-lightbulb me-1"></i> Intenta con: DTC, borrado, congelación, código...
                </p>
            </div>
        `;
    estadisticasDiv.style.display = "none";
    return;
  }

  // Estadísticas
  estadisticasDiv.style.display = "block";
  estadisticasTexto.textContent = `${resultados.length} resultado${resultados.length > 1 ? "s" : ""} encontrado${resultados.length > 1 ? "s" : ""} para "${query}"`;

  // Mostrar resultados
  resultadosDiv.innerHTML = resultados
    .map((r, index) => {
      let icon = "📌";
      if (r.nivel === 0) icon = "📂";
      else if (r.nivel === 1) icon = "📁";
      else if (r.nivel >= 2) icon = "📄";

      const nivelText =
        r.nivel === 0 ? "Menú" : r.nivel === 1 ? "Submenú" : `Nivel ${r.nivel}`;

      return `
            <div class="card resultado-item mb-2 border-0 shadow-sm" style="animation-delay: ${index * 0.05}s;">
                <div class="card-body py-3 px-3">
                    <div class="d-flex align-items-start gap-2">
                        <span class="fs-5">${icon}</span>
                        <div class="flex-grow-1">
                            <div class="fw-semibold">${escapeHtml(r.nombre)}</div>
                            <div class="text-muted small">
                                <i class="bi bi-folder me-1"></i> ${escapeHtml(r.ruta)}
                            </div>
                            <div class="mt-2 d-flex gap-2 flex-wrap">
                                <span class="badge badge-position">
                                    <i class="bi bi-pin me-1"></i> ${escapeHtml(r.posicion)}
                                </span>
                                <span class="badge bg-light text-secondary">
                                    ${nivelText}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    })
    .join("");
}

// ===== UTILIDADES =====
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function mostrarEstadoVacio() {
  resultadosDiv.innerHTML = `
        <div class="text-center py-5 empty-state">
            <div class="display-1 mb-3">🔍</div>
            <h5 class="text-secondary">Busca en el menú</h5>
            <p class="text-muted">Escribe el nombre de una válvula, código o submenú para encontrarlo rápidamente</p>
            <div class="d-flex flex-wrap justify-content-center gap-2 mt-3">
                <span class="text-muted small me-1">Ejemplos:</span>
                <button class="btn btn-outline-primary btn-sm example-btn" data-query="DTC">DTC</button>
                <button class="btn btn-outline-primary btn-sm example-btn" data-query="borrado">Borrado</button>
                <button class="btn btn-outline-primary btn-sm example-btn" data-query="congelación">Congelación</button>
                <button class="btn btn-outline-primary btn-sm example-btn" data-query="transmisión">Transmisión</button>
            </div>
        </div>
    `;

  document.querySelectorAll(".example-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const query = this.dataset.query;
      buscador.value = query;
      limpiarBtn.style.display = "block";
      realizarBusqueda(query);
      searchHint.innerHTML = `<i class="bi bi-search me-1"></i> Buscando: "${query}"`;
    });
  });
}

// ===== EVENTOS =====

buscador.addEventListener("input", function () {
  const query = this.value.trim();

  limpiarBtn.style.display = query.length > 0 ? "block" : "none";

  if (query.length === 0) {
    searchHint.innerHTML =
      '<i class="bi bi-lightbulb me-1"></i> Escribe al menos 2 caracteres para buscar';
    mostrarEstadoVacio();
    estadisticasDiv.style.display = "none";
    return;
  }

  if (query.length < 2) {
    searchHint.innerHTML =
      '<i class="bi bi-keyboard me-1"></i> Escribe al menos 2 caracteres...';
    resultadosDiv.innerHTML = `
            <div class="text-center py-5">
                <div class="display-1 mb-3">⌨️</div>
                <h5 class="text-secondary">Escribe al menos 2 caracteres</h5>
                <p class="text-muted">Para comenzar la búsqueda</p>
            </div>
        `;
    estadisticasDiv.style.display = "none";
    return;
  }

  searchHint.innerHTML = `<i class="bi bi-search me-1"></i> Buscando: "${query}"`;

  clearTimeout(timeout);
  timeout = setTimeout(() => {
    realizarBusqueda(query);
  }, 300);
});

limpiarBtn.addEventListener("click", function () {
  buscador.value = "";
  this.style.display = "none";
  searchHint.innerHTML =
    '<i class="bi bi-lightbulb me-1"></i> Escribe al menos 2 caracteres para buscar';
  mostrarEstadoVacio();
  estadisticasDiv.style.display = "none";
  buscador.focus();
});

buscador.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    limpiarBtn.click();
  }
});

// ===== FECHA ACTUAL =====
function actualizarFecha() {
  const ahora = new Date();
  const opciones = { year: "numeric", month: "long", day: "numeric" };
  document.getElementById("fechaActual").textContent = ahora.toLocaleDateString(
    "es-ES",
    opciones,
  );
}

// ===== INICIALIZAR =====
async function iniciar() {
  await cargarDatos();
  mostrarEstadoVacio();
  actualizarFecha();

  if (window.innerWidth > 768) {
    setTimeout(() => buscador.focus(), 500);
  }

  console.log("✅ Buscador de Válvulas iniciado correctamente");
}

document.addEventListener("DOMContentLoaded", iniciar);
