"""Servidor local del dashboard, sin dependencias externas."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "Data" / "observaciones.csv"


class DashboardHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / "Frontend"), **kwargs)

    def send_head(self):
        if self.path.split("?", 1)[0] != "/datos.csv":
            return super().send_head()
        try:
            source = DATA.open("rb")
        except FileNotFoundError:
            self.send_error(404, "Falta Data/observaciones.csv")
            return None
        self.send_response(200)
        self.send_header("Content-Type", "text/csv; charset=utf-8")
        self.send_header("Content-Length", str(DATA.stat().st_size))
        self.end_headers()
        return source


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1", help="Dirección de escucha. Usá 0.0.0.0 para la red local.")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    with ThreadingHTTPServer((args.host, args.port), DashboardHandler) as server:
        print(f"Dashboard disponible en http://{args.host}:{args.port}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
