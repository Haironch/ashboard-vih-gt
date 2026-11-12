"use strict";

const profileIndicators = new Set([
  "notificaciones_por_escolaridad", "notificaciones_por_estado_civil",
  "notificaciones_por_pueblo", "notificaciones_por_orientacion_segun_informe",
]);

const views = {
  vigilancia: {
    first: "notificaciones_vih",
    description: "Consultá los diagnósticos notificados y sus tasas por departamento de residencia.",
    geography: "departamento_residencia",
    includes: row => row.tipo === "notificacion" && !profileIndicators.has(row.indicador),
    cards: [
      ["Notificaciones de VIH", national("notificaciones_vih", 2026), "EPIWEB · enero–septiembre de 2026"],
      ["Fallecimientos asociados al VIH", national("fallecimientos_asociados_vih_registro", 2026, "RENAP / EPIWEB / SIGSA 1.2"), "Registro de mortalidad · enero–septiembre de 2026"],
      ["Tamizajes de VIH", national("tamizajes_vih", 2026, "SIGSA SIDA 1.2"), "SIGSA · enero–septiembre de 2026"],
    ],
  },
  mortalidad: {
    first: "fallecimientos_asociados_vih_registro",
    description: "Explorá el registro de mortalidad y los fallecimientos entre los casos notificados.",
    geography: "departamento_residencia",
    coverage: "RENAP / EPIWEB / SIGSA 1.2",
    includes: row => row.tipo === "mortalidad",
    cards: [
      ["Fallecimientos asociados al VIH", national("fallecimientos_asociados_vih_registro", 2026, "RENAP / EPIWEB / SIGSA 1.2"), "Registro de mortalidad · enero–septiembre de 2026"],
      ["Fallecimientos entre casos notificados", national("fallecimientos_cohorte_notificada_vih", 2026), "EPIWEB · enero–septiembre de 2026"],
      ["Fallecimientos asociados al VIH", national("fallecimientos_asociados_vih_registro", 2025, "RENAP / EPIWEB / SIGSA 1.2"), "Registro de mortalidad · año completo 2025"],
    ],
  },
  tamizaje: {
    first: "tamizajes_vih",
    description: "Revisá las pruebas de VIH por sexo, período y dirección de red de servicios.",
    geography: "DDRISS",
    coverage: "SIGSA SIDA 1.2",
    includes: row => row.tipo === "tamizaje",
    cards: [
      ["Pruebas de tamizaje", national("tamizajes_vih", 2026, "SIGSA SIDA 1.2"), "SIGSA · enero–septiembre de 2026"],
      ["Embarazadas tamizadas", national("embarazadas_tamizadas_vih", 2026, "SIGSA SIDA / personas embarazadas"), "SIGSA · enero–septiembre de 2026"],
      ["Pruebas de tamizaje", national("tamizajes_vih", 2025, "SIGSA SIDA 1.2"), "SIGSA · año completo 2025"],
    ],
  },
  perfil: {
    first: "notificaciones_por_escolaridad",
    description: "Consultá los desgloses publicados por escolaridad, estado civil, pueblo y orientación según el informe.",
    includes: row => profileIndicators.has(row.indicador),
    cards: [
      ["Notificaciones de VIH", national("notificaciones_vih", 2025), "EPIWEB · año completo 2025"],
      ["Proporción de VIH avanzado", national("proporcion_notificaciones_vih_avanzado", 2025), "EPIWEB · año completo 2025", "%"],
      ["Notificaciones de VIH durante el embarazo", national("notificaciones_vih_en_embarazo", 2025), "EPIWEB · año completo 2025"],
    ],
  },
  atencion: {
    first: "personas_vinculadas_uai",
    description: "Consultá la vinculación y el inicio de tratamiento por Unidad de Atención Integral.",
    geography: "UAI",
    includes: row => row.tipo === "atencion",
    cards: [
      ["Personas vinculadas", national("personas_vinculadas_uai", 2026), "EPIWEB · enero–septiembre de 2026"],
      ["Inicios de tratamiento registrados", national("personas_con_inicio_tar_registrado", 2026), "EPIWEB · enero–septiembre de 2026"],
      ["Personas sin vinculación", national("personas_sin_vinculacion_uai", 2026), "EPIWEB · enero–septiembre de 2026"],
    ],
  },
  estimaciones: {
    first: "nuevas_infecciones_vih",
    description: "Explorá las estimaciones nacionales y los indicadores y metas de ONUSIDA.",
    includes: row => row.fuente === "Banco Mundial" || row.fuente === "ONUSIDA",
    cards: [
      ["Nuevas infecciones estimadas", national("nuevas_infecciones_vih", 2024, "nacional"), "Banco Mundial / ONUSIDA · 2024"],
      ["Indicadores disponibles", rows => new Set(rows.filter(row => row.fuente === "ONUSIDA").map(row => row.indicador)).size, "Archivo de ONUSIDA · edición 2026"],
      ["Metas publicadas", rows => rows.filter(row => row.fuente === "ONUSIDA" && row.tipo === "meta").length, "Observaciones de ONUSIDA · edición 2026"],
    ],
  },
};

const names = {
  notificaciones_vih: "Notificaciones de VIH",
  notificaciones_por_escolaridad: "Notificaciones por escolaridad",
  notificaciones_por_estado_civil: "Notificaciones por estado civil",
  notificaciones_por_pueblo: "Notificaciones por pueblo",
  notificaciones_por_orientacion_segun_informe: "Notificaciones por orientación según el informe",
  tamizajes_vih: "Pruebas de tamizaje de VIH",
  embarazadas_tamizadas_vih: "Embarazadas tamizadas",
  proporcion_notificaciones_vih_avanzado: "Proporción de notificaciones de VIH avanzado",
  tasa_notificacion_vih: "Tasa de notificación de VIH",
  fallecimientos_asociados_vih_registro: "Fallecimientos asociados al VIH · registro",
  fallecimientos_cohorte_notificada_vih: "Fallecimientos entre los casos notificados",
  nuevas_infecciones_vih: "Nuevas infecciones estimadas · Banco Mundial",
  personas_vinculadas_uai: "Personas vinculadas a una UAI",
  personas_en_cuadro_inicio_tar: "Personas en el cuadro de inicio de tratamiento",
  personas_con_inicio_tar_registrado: "Inicio de tratamiento registrado",
  personas_sin_inicio_tar_registrado: "Sin inicio de tratamiento registrado",
  personas_por_dias_hasta_tar: "Personas por días hasta iniciar tratamiento",
  ANC_TESTING: "Pruebas de VIH en embarazadas",
  EARLY_INFANT_DIAGNOSIS: "Diagnóstico infantil temprano",
  LATE_HIV_DIAGNOSIS: "Diagnóstico tardío de VIH",
  MTCT_RATE: "Tasa de transmisión maternoinfantil",
  COVERAGE_MOTHERS_RECEIVING_ARV: "Cobertura de antirretrovirales en embarazadas",
  MOTHERS_NEEDING_ARV_FOR_PMTCT: "Embarazadas que necesitan antirretrovirales",
  MOTHERS_RECEIVING_ARV_FOR_PMTCT: "Embarazadas que recibieron antirretrovirales",
  NEWLY_INITIATING_ART: "Personas que iniciaron tratamiento · ONUSIDA",
  TARGET_IPR: "Meta de razón incidencia/prevalencia",
  TARGET_ON_ART_VL_SUPPRESSED: "Meta de supresión viral en tratamiento",
  TARGET_PLHIV_ON_ART: "Meta de personas en tratamiento",
  TARGET_PLHIV_KNOWLEDGE_OF_STATUS: "Meta de conocimiento del diagnóstico",
  TARGET_KNOW_STATUS_ON_ART: "Meta de tratamiento con diagnóstico conocido",
  TARGET_PLHIV_VIRAL_SUPPRESSION: "Meta de supresión viral",
};

const geography = {
  pais: "Nacional", departamento_residencia: "Departamento de residencia",
  residencia_extranjero: "Residencia en el extranjero", residencia_sin_dato: "Residencia sin dato",
  otra_residencia: "Otra residencia", DDRISS: "Dirección de red de servicios", UAI: "Unidad de Atención Integral",
};
const sexes = { total: "Total publicado", M: "Masculino", F: "Femenino" };
const periods = { anual: "Año completo", mensual: "Mes", parcial: "Corte parcial", plurianual: "Varios años" };
const number = new Intl.NumberFormat("es-GT", { maximumFractionDigits: 2 });
const collator = new Intl.Collator("es", { numeric: true });
const date = new Intl.DateTimeFormat("es-GT", { month: "short", year: "numeric", timeZone: "UTC" });
const pageSize = 15;
const byId = id => document.getElementById(id);
const indicatorName = id => names[id] || id.replaceAll("_", " ").replace(/^./u, letter => letter.toUpperCase());
const territoryName = id => id === "GTM" ? "Guatemala (nacional)" : id;
const formatDate = value => date.format(new Date(value + "T00:00:00Z"));

let data = [];
let current = "vigilancia";
let filters = {};
let selection = [];
let page = 0;

function readCSV(csv) {
  const matrix = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (char === '"') {
      if (quoted && csv[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && (char === "," || char === "\n" || char === "\r")) {
      row.push(field);
      field = "";
      if (char !== ",") {
        matrix.push(row);
        row = [];
        if (char === "\r" && csv[i + 1] === "\n") i++;
      }
    } else {
      field += char;
    }
  }
  if (field || row.length) matrix.push([...row, field]);
  const header = matrix.shift();
  return matrix.map(fields => Object.fromEntries(header.map((key, index) => [key, fields[index]])));
}

function decorate(row) {
  const { periodo_inicio: start, periodo_fin: end } = row;
  row.granularidad = start.slice(0, 4) !== end.slice(0, 4) ? "plurianual" :
    start.slice(0, 7) === end.slice(0, 7) ? "mensual" :
    start.endsWith("01-01") && end.endsWith("12-31") ? "anual" : "parcial";
  row.periodo = start + "/" + end;
  row.valor = Number(row.valor);
  return row;
}

function periodName(key) {
  const [start, end] = key.split("/");
  if (start.endsWith("01-01") && end === start.slice(0, 4) + "-12-31") return start.slice(0, 4);
  if (start.slice(0, 7) === end.slice(0, 7)) return formatDate(start);
  return formatDate(start) + " a " + formatDate(end);
}

function element(tag, content, className) {
  const node = document.createElement(tag);
  if (content !== undefined) node.textContent = content;
  if (className) node.className = className;
  return node;
}

function addFilter(rows, { key, label, display = value => value, all, preferred, reverse }) {
  const choices = [...new Set(rows.map(row => row[key]))].sort(collator.compare);
  if (reverse) choices.reverse();
  if (all) choices.unshift("");
  const value = choices.includes(filters[key]) ? filters[key] :
    choices.includes(preferred) ? preferred : choices[0];
  filters[key] = value;
  const field = element("label", label);
  const select = element("select");
  select.id = "filtro-" + key;
  select.disabled = choices.length < 2;
  for (const choice of choices) {
    const option = element("option", choice ? display(choice) : all);
    option.value = choice;
    select.append(option);
  }
  select.value = value;
  select.addEventListener("change", () => {
    const keys = [...byId("filtros").querySelectorAll("select")].map(node => node.id.slice(7));
    for (const later of keys.slice(keys.indexOf(key) + 1)) delete filters[later];
    filters[key] = select.value;
    render();
    byId(select.id)?.focus();
  });
  field.append(select);
  byId("filtros").append(field);
  return value ? rows.filter(row => row[key] === value) : rows;
}

function national(indicator, year, coverage = "EPIWEB") {
  return rows => rows.find(row => row.indicador === indicator && row.territorio === "GTM" &&
    row.periodo_inicio === year + "-01-01" && row.periodo_fin === year + (year === 2026 ? "-09-30" : "-12-31") &&
    row.sexo === "total" && row.grupo_etario === "total" && row.clasificacion === "total" &&
    row.cobertura === coverage)?.valor;
}

function renderCards() {
  const cards = views[current].cards.map(([label, measure, detail, suffix = ""]) => {
    const value = measure(data);
    const card = element("article", undefined, "card");
    card.append(element("h2", label), element("strong", value === undefined ? "—" : number.format(value) + suffix), element("p", detail));
    return card;
  });
  byId("resumen").replaceChildren(...cards);
}

function render() {
  const view = views[current];
  byId("filtros").replaceChildren();
  let rows = data.filter(view.includes);
  rows = addFilter(rows, { key: "indicador", label: "Indicador", display: indicatorName, preferred: view.first });
  rows = addFilter(rows, { key: "nivel_geografico", label: "Nivel geográfico", display: value => geography[value] || value,
    preferred: view.geography || "pais" });
  rows = addFilter(rows, { key: "territorio", label: "Territorio", display: territoryName,
    all: rows.some(row => row.nivel_geografico !== "pais") ? "Todos los territorios" : undefined });
  rows = addFilter(rows, { key: "granularidad", label: "Tipo de período", display: value => periods[value],
    preferred: ["estimaciones", "perfil"].includes(current) ? "anual" : "parcial" });
  rows = addFilter(rows, { key: "periodo", label: "Período", display: periodName,
    all: current !== "perfil" && (filters.territorio || filters.nivel_geografico === "pais") ? "Todos los períodos" : undefined,
    preferred: current === "estimaciones" ? "" : undefined, reverse: true });
  rows = addFilter(rows, { key: "sexo", label: "Sexo", display: value => sexes[value] || value, preferred: "total" });
  rows = addFilter(rows, { key: "grupo_etario", label: "Edad", display: value => value === "total" ? "Todas las edades (total)" : value,
    preferred: "total" });
  rows = addFilter(rows, { key: "clasificacion", label: "Clasificación", display: value => value === "total" ? "Total publicado" : value,
    preferred: rows.some(row => row.clasificacion === "estimación central") ? "estimación central" : "total" });
  if (current === "perfil") {
    rows = rows.filter(row => row.cobertura.startsWith(row.fuente_original + " / "));
  }
  rows = addFilter(rows, { key: "cobertura", label: current === "perfil" ? "Categoría" : "Cobertura / subgrupo",
    all: current === "perfil" ? "Todas las categorías" : undefined,
    display: current === "perfil" ? value => categoryName(rows.find(row => row.cobertura === value)) : undefined,
    preferred: current === "perfil" ? "" : view.coverage || "EPIWEB" });
  selection = rows.sort((a, b) => b.periodo.localeCompare(a.periodo) || b.valor - a.valor || collator.compare(a.territorio, b.territorio));
  page = 0;
  renderChart();
  renderDepartmentMap(selection, filters);
  renderTable();
}

function categoryName(row) {
  const prefix = row.fuente_original + " / ";
  return row.cobertura.startsWith(prefix) ? row.cobertura.slice(prefix.length) : row.cobertura;
}

function renderMonthlyComparison() {
  const panel = byId("comparacion");
  const rows = data.filter(row => row.indicador === "notificaciones_vih" &&
    row.territorio === "GTM" && row.cobertura === "EPIWEB" && row.granularidad === "mensual" &&
    row.sexo === "total" && row.clasificacion === "total" && row.grupo_etario === "total");
  const values = new Map(rows.map(row => [row.periodo_inicio.slice(0, 7), row.valor]));
  const months = Array.from({ length: 9 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");
    return [month, values.get("2025-" + month), values.get("2026-" + month)];
  });
  panel.hidden = current !== "vigilancia" || months.some(([, prior, recent]) => prior === undefined || recent === undefined);
  if (panel.hidden) return;

  const priorTotal = months.reduce((total, [, prior]) => total + prior, 0);
  const recentTotal = months.reduce((total, [, , recent]) => total + recent, 0);
  const percent = new Intl.NumberFormat("es-GT", { style: "percent", signDisplay: "exceptZero", maximumFractionDigits: 1 });
  byId("variacion").textContent = priorTotal ? percent.format((recentTotal - priorTotal) / priorTotal) + " en 2026" : "";
  const max = Math.max(1, ...months.flatMap(([, prior, recent]) => [prior, recent]));
  const monthFormat = new Intl.DateTimeFormat("es-GT", { month: "short", timeZone: "UTC" });
  const columns = months.map(([month, prior, recent]) => {
    const label = monthFormat.format(new Date("2026-" + month + "-01T00:00:00Z"));
    const group = element("div", undefined, "month");
    const pair = element("div", undefined, "pair");
    for (const [year, count, style] of [[2025, prior, "prior"], [2026, recent, "recent"]]) {
      const column = element("div", undefined, "column " + style);
      column.style.height = (100 * count / max) + "%";
      column.title = label + " " + year + " · " + number.format(count);
      column.setAttribute("role", "img");
      column.setAttribute("aria-label", column.title);
      pair.append(column);
    }
    group.append(pair, element("span", label));
    return group;
  });
  byId("comparacion-mensual").replaceChildren(...columns);
}

function renderChart() {
  const chart = byId("grafica");
  chart.replaceChildren();
  const categories = current === "perfil";
  const isRanking = categories || new Set(selection.map(row => row.territorio)).size > 1;
  const title = indicatorName(filters.indicador);
  byId("titulo-grafica").textContent = title;
  byId("unidad").textContent = selection[0]?.unidad || "";
  if (!selection.length) {
    byId("nota").textContent = "No hay observaciones con estos filtros.";
    return;
  }
  const plotted = isRanking ? selection.slice(0, 12) : selection.slice(0, 15).reverse();
  const context = categories ? "Distribución por categoría · " + periodName(selection[0].periodo) : isRanking ? (selection.length > 12 ? "12 territorios con mayor valor" : "Comparación territorial") +
    " · " + periodName(selection[0].periodo) : selection.length > 15 ? "15 períodos más recientes" : "Valores publicados";
  const values = selection.map(row => row.valor).sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  const median = values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const comparable = !categories && (isRanking || filters.granularidad === "anual" || filters.granularidad === "mensual");
  byId("nota").textContent = context + (values.length > 1 && comparable ?
    " · Media " + number.format(mean) + " · Mediana " + number.format(median) : "");
  const max = Math.max(...plotted.map(row => row.valor)) || 1;
  for (const row of plotted) {
    const bar = element("div", undefined, "bar-row");
    const track = element("div", undefined, "bar-track");
    track.setAttribute("aria-hidden", "true");
    const fill = element("div", undefined, "bar-fill");
    fill.style.width = (100 * row.valor / max) + "%";
    track.append(fill);
    bar.append(element("span", categories ? categoryName(row) : isRanking ? territoryName(row.territorio) : periodName(row.periodo)),
      track, element("strong", number.format(row.valor), "number"));
    chart.append(bar);
  }
}

function renderTable() {
  const last = Math.max(1, Math.ceil(selection.length / pageSize));
  byId("conteo").textContent = number.format(selection.length) + " filas";
  byId("pagina").textContent = (page + 1) + " de " + last;
  byId("anterior").disabled = page === 0;
  byId("siguiente").disabled = page + 1 >= last;
  byId("filas").replaceChildren(...selection.slice(page * pageSize, (page + 1) * pageSize).map(row => {
    const tr = element("tr");
    const breakdown = [row.sexo, row.grupo_etario, row.clasificacion]
      .filter(value => value !== "total").map(value => sexes[value] || value);
    if (current === "perfil") breakdown.unshift(categoryName(row));
    const source = element("td");
    const link = element("a", row.fuente + (row.pagina ? " · p. " + row.pagina : ""));
    if (/^https?:\/\//.test(row.url)) {
      link.href = row.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    source.append(link, element("div", row.archivo_fuente || row.referencia, "muted"));
    if (row.archivo_fuente && !row.pagina && row.referencia) {
      source.append(element("div", row.referencia, "muted"));
    }
    tr.append(element("td", periodName(row.periodo)), element("td", territoryName(row.territorio)),
      element("td", breakdown.join(" · ") || "Total"), element("td", number.format(row.valor), "number"), source);
    return tr;
  }));
}

function changeView(name) {
  current = name;
  filters = {};
  byId("descripcion-vista").textContent = views[name].description;
  for (const button of byId("vistas").querySelectorAll("button")) {
    button.setAttribute("aria-pressed", String(button.dataset.view === name));
  }
  if (data.length) {
    renderCards();
    renderMonthlyComparison();
    render();
  }
}

byId("vistas").addEventListener("click", event => {
  const button = event.target.closest("[data-view]");
  if (button) changeView(button.dataset.view);
});
byId("reset").addEventListener("click", () => changeView(current));
byId("anterior").addEventListener("click", () => { page--; renderTable(); });
byId("siguiente").addEventListener("click", () => { page++; renderTable(); });

function loadDashboard(csv) {
  const rows = readCSV(csv);
  if (!rows.length || !Object.hasOwn(rows[0], "indicador") || !Object.hasOwn(rows[0], "periodo_fin")) {
    throw new Error("CSV incompatible");
  }
  data = rows.map(decorate);
  changeView(current);
  byId("estado").hidden = true;
  byId("archivo-local").hidden = true;
  byId("dashboard").hidden = false;
}

function showFilePicker(message) {
  const status = byId("estado");
  status.textContent = message;
  status.classList.remove("is-loading");
  status.hidden = false;
  byId("archivo-local").hidden = false;
}

byId("archivo").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  const status = byId("estado");
  status.textContent = "Cargando datos…";
  status.classList.add("is-loading");
  status.hidden = false;
  try {
    loadDashboard(await file.text());
  } catch (error) {
    console.error(error);
    showFilePicker("Elegí el archivo Data/observaciones.csv del proyecto.");
  }
});

if (location.protocol === "file:") {
  showFilePicker("Seleccioná el CSV consolidado para ver el dashboard.");
} else {
  fetch("/datos.csv")
    .then(response => {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.text();
    })
    .then(loadDashboard)
    .catch(error => {
      console.error(error);
      showFilePicker("No se pudo cargar el CSV desde el servidor. Podés seleccionarlo manualmente.");
    });
}
