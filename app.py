"""
Servidor de Aplicación OLAP Studio 360
100% Libre / Zero Dependencies / Baterías Incluidas
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080

class OlapServerHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Habilitar CORS y cabeceras de caché modernas
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

def run():
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)
    
    handler = OlapServerHandler
    try:
        with socketserver.TCPServer(("", PORT), handler) as httpd:
            print("=" * 65)
            print("🚀 OLAP Studio 360 - Actividad Grupal 01-U2")
            print("⚡ Servidor local iniciado correctamente (100% Libre)")
            print(f"🌐 Accede en tu navegador: http://localhost:{PORT}")
            print("Presiona Ctrl + C para detener el servidor")
            print("=" * 65)
            
            # Abrir navegador automáticamente si es interactivo
            try:
                webbrowser.open(f"http://localhost:{PORT}")
            except Exception:
                pass
                
            httpd.serve_forever()
    except OSError as e:
        print(f"Puerto {PORT} en uso o no disponible. Probando puerto 8000...")
        with socketserver.TCPServer(("", 8000), handler) as httpd:
            print(f"🌐 Accede en tu navegador: http://localhost:8000")
            httpd.serve_forever()

if __name__ == "__main__":
    run()
