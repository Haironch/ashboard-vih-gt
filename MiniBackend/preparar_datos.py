"""Genera el CSV y la base SQLite de estimaciones nacionales de VIH."""
import argparse
import csv
import hashlib
import json
import sqlite3
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CODIGO = "SH.HIV.INCD.TL"
URL_API = f"https://api.worldbank.org/v2/country/GTM/indicator/{CODIGO}?format=json&per_page=100"
CAMPOS = (
    "indicador", "tipo", "valor", "unidad", "territorio", "nivel_geografico",
    "periodo_inicio", "periodo_fin", "fuente", "fuente_original", "url",
    "referencia", "version_fuente", "preliminar",
)


def estimacion(anio, valor, url, version):
    return (
        "nuevas_infecciones_vih", "estimacion", valor, "personas", "GTM", "pais",
        f"{anio}-01-01", f"{anio}-12-31", "Banco Mundial", "ONUSIDA", url,
        CODIGO, version, None,
    )


def cargar_api(archivo):
    contenido = archivo.read_bytes()
    meta, registros = json.loads(contenido)
    if meta["pages"] != 1 or len(registros) != meta["total"]:
        raise ValueError("Se requiere la respuesta completa de la API del Banco Mundial.")
    version = meta["lastupdated"]
    anios = set()
    filas = []
    for registro in registros:
        if registro["countryiso3code"] != "GTM" or registro["indicator"]["id"] != CODIGO:
            raise ValueError("La respuesta contiene otro país o indicador.")
        anio = int(registro["date"])
        if not 1900 <= anio <= 9999 or anio in anios:
            raise ValueError(f"Año inválido o duplicado: {anio}")
        anios.add(anio)
        valor = registro["value"]
        if valor is None:
            continue
        if type(valor) is not int or valor < 0:
            raise ValueError(f"Conteo inválido para {anio}: {valor!r}")
        filas.append(estimacion(anio, valor, URL_API, version))
    if not filas:
        raise ValueError("La respuesta no contiene observaciones numéricas.")
    archivo_original = RAIZ / "Recursos" / f"banco_mundial_{hashlib.sha256(contenido).hexdigest()}.json"
    archivo_original.parent.mkdir(exist_ok=True)
    archivo_original.write_bytes(contenido)
    return sorted(filas, key=lambda fila: fila[6]), len(registros) - len(filas)


def escribir(filas):
    salida = RAIZ / "Recursos" / "Prototipo"
    salida.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(salida / "vih_guatemala.sqlite") as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS observaciones (
                indicador TEXT NOT NULL,
                tipo TEXT NOT NULL,
                valor NUMERIC NOT NULL CHECK (valor >= 0),
                unidad TEXT NOT NULL,
                territorio TEXT NOT NULL,
                nivel_geografico TEXT NOT NULL,
                periodo_inicio TEXT NOT NULL,
                periodo_fin TEXT NOT NULL CHECK (periodo_fin >= periodo_inicio),
                fuente TEXT NOT NULL,
                fuente_original TEXT NOT NULL,
                url TEXT NOT NULL,
                referencia TEXT NOT NULL,
                version_fuente TEXT NOT NULL,
                preliminar INTEGER CHECK (preliminar IN (0, 1)),
                PRIMARY KEY (indicador, tipo, territorio, nivel_geografico,
                             periodo_inicio, periodo_fin, fuente)
            )
        """)
        db.execute(
            "DELETE FROM observaciones WHERE fuente = ? AND referencia = ? AND territorio = ?",
            ("Banco Mundial", CODIGO, "GTM"),
        )
        db.executemany(
            f"INSERT INTO observaciones ({', '.join(CAMPOS)}) VALUES ({', '.join(['?'] * len(CAMPOS))})",
            filas,
        )
        exportacion = db.execute(
            f"SELECT {', '.join(CAMPOS)} FROM observaciones ORDER BY indicador, territorio, periodo_inicio"
        ).fetchall()

    with (salida / "observaciones.csv").open("w", encoding="utf-8", newline="") as archivo:
        escritor = csv.writer(archivo)
        escritor.writerow(CAMPOS)
        escritor.writerows(exportacion)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("json_banco_mundial", type=Path)
    args = parser.parse_args()
    filas, faltantes = cargar_api(args.json_banco_mundial)
    escribir(filas)
    print(f"Importadas {len(filas)} estimaciones; {faltantes} años sin valor publicado.")


if __name__ == "__main__":
    main()
