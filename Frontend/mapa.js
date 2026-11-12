"use strict";

// The tile positions approximate the relative locations of the departments.
const departmentTiles = [
  ["Petén", 5, 1], ["Huehuetenango", 2, 2], ["Quiché", 3, 2], ["Alta Verapaz", 4, 2], ["Izabal", 6, 2],
  ["San Marcos", 1, 3], ["Totonicapán", 2, 3], ["Sololá", 3, 3], ["Baja Verapaz", 4, 3], ["El Progreso", 5, 3], ["Zacapa", 6, 3],
  ["Quetzaltenango", 2, 4], ["Chimaltenango", 3, 4], ["Guatemala", 4, 4], ["Jalapa", 5, 4], ["Chiquimula", 6, 4],
  ["Retalhuleu", 1, 5], ["Suchitepéquez", 2, 5], ["Sacatepéquez", 3, 5], ["Escuintla", 4, 5], ["Santa Rosa", 5, 5], ["Jutiapa", 6, 5],
];
const boundaryFile = "wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/GTM/ADM1/geoBoundaries-GTM-ADM1_simplified.geojson";
const boundaryURLs = [
  "https://raw.githubusercontent.com/" + boundaryFile,
  "https://media.githubusercontent.com/media/" + boundaryFile,
];
const heatColors = ["#e4f4f0", "#b5e2d6", "#77c5b5", "#348f80", "#135e55"];
const missingColor = "#e5eaf1";
const zeroColor = "#fff";
const svgNamespace = "http://www.w3.org/2000/svg";
let boundaries;
let boundaryRequest;

function departmentKey(name) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase().replace(/^EL (PETEN|QUICHE)$/, "$1");
}

function prepareBoundaries(features) {
  const names = new Set(departmentTiles.map(([name]) => departmentKey(name)));
  const items = features.map(feature => {
    const name = departmentKey(feature.properties.shapeName);
    const geometry = feature.geometry;
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    return { name, polygons };
  });
  if (items.length !== names.size || new Set(items.map(item => item.name)).size !== names.size ||
      items.some(item => !names.has(item.name))) throw new Error("Límites departamentales incompatibles");

  const coords = items.flatMap(item => item.polygons.flat(2));
  const minX = Math.min(...coords.map(([x]) => x));
  const maxY = Math.max(...coords.map(([, y]) => y));
  const scale = 105;
  const width = (Math.max(...coords.map(([x]) => x)) - minX) * scale + 12;
  const height = (maxY - Math.min(...coords.map(([, y]) => y))) * scale + 12;
  const paths = items.map(({ name, polygons }) => ({
    name,
    path: polygons.flatMap(polygon => polygon.map(ring => ring.map(([x, y], index) =>
      (index ? "L" : "M") + ((x - minX) * scale + 6).toFixed(2) + "," +
      ((maxY - y) * scale + 6).toFixed(2)).join("") + "Z")).join(""),
  }));
  return { width, height, paths };
}

function renderDepartmentMap(rows, activeFilters) {
  const panel = byId("mapa-panel");
  panel.hidden = activeFilters.nivel_geografico !== "departamento_residencia" || !rows.length;
  if (panel.hidden) return;

  const period = rows[0].periodo;
  const knownDepartments = new Set(departmentTiles.map(([name]) => departmentKey(name)));
  const values = new Map();
  for (const row of rows) {
    if (row.periodo !== period) continue;
    const key = departmentKey(row.territorio);
    if (!knownDepartments.has(key)) continue;
    const previous = values.get(key);
    values.set(key, previous !== undefined && previous !== row.valor ? null : row.valor);
  }
  const max = Math.max(0, ...values.values());
  const colorFor = value => value == null ? missingColor : value === 0 ? zeroColor :
    heatColors[Math.min(heatColors.length - 1, Math.ceil(value / max * heatColors.length) - 1)];
  const unit = rows[0].unidad;
  byId("mapa-contexto").textContent = indicatorName(activeFilters.indicador) + " · " + periodName(period) +
    " · " + unit + (boundaries ? "" : " · Vista esquemática");
  const hint = byId("mapa-detalle");
  hint.textContent = "Seleccioná un departamento para ver el valor.";
  const layer = boundaries ? document.createElementNS(svgNamespace, "svg") : element("div", undefined, "map-tiles");
  if (boundaries) {
    layer.setAttribute("viewBox", "0 0 " + boundaries.width + " " + boundaries.height);
    layer.setAttribute("class", "department-map");
    layer.setAttribute("aria-label", "Departamentos de Guatemala");
  }
  for (const [name, column, row] of departmentTiles) {
    const key = departmentKey(name);
    const value = values.get(key);
    const label = name + " · " + (value == null ? "Sin dato para esta selección" : number.format(value) + " " + unit);
    const region = boundaries ? document.createElementNS(svgNamespace, "path") : element("button", name, "map-tile");
    if (boundaries) {
      region.setAttribute("d", boundaries.paths.find(item => item.name === key).path);
      region.setAttribute("fill-rule", "evenodd");
      region.setAttribute("fill", colorFor(value));
      region.setAttribute("tabindex", "0");
      region.setAttribute("role", "button");
      const title = document.createElementNS(svgNamespace, "title");
      title.textContent = label;
      region.append(title);
      region.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          hint.textContent = label;
        }
      });
    } else {
      region.style.gridColumn = column;
      region.style.gridRow = row;
      region.style.backgroundColor = colorFor(value);
      if (value > max * 0.6) region.style.color = "#fff";
      region.title = label;
    }
    region.setAttribute("aria-label", label);
    for (const event of ["click", "focus", "pointerenter"]) {
      region.addEventListener(event, () => { hint.textContent = label; });
    }
    layer.append(region);
  }
  byId("mapa-superficie").replaceChildren(layer);

  const legend = [[zeroColor, "0"], [missingColor, "Sin dato"]];
  if (max > 0) {
    const format = new Intl.NumberFormat("es-GT", { maximumSignificantDigits: 4 });
    for (const [index, color] of heatColors.entries()) {
      const start = format.format(max * index / heatColors.length);
      const end = format.format(max * (index + 1) / heatColors.length);
      legend.push([color, "> " + start + " a " + end]);
    }
  }
  byId("mapa-leyenda").replaceChildren(...legend.map(([color, text]) => {
    const item = element("span");
    const swatch = element("i");
    swatch.style.backgroundColor = color;
    item.append(swatch, element("span", text));
    return item;
  }));

  if (!boundaryRequest) {
    boundaryRequest = Promise.any(boundaryURLs.map(async url => {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error("HTTP " + response.status);
      return prepareBoundaries((await response.json()).features);
    })).then(geometry => {
      boundaries = geometry;
      renderDepartmentMap(selection, filters);
    }).catch(() => { /* The labeled tile map works offline. */ });
  }
}
