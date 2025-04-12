from http.server import HTTPServer, BaseHTTPRequestHandler
import socket

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        
        hostname = socket.gethostname()
        html = f"""
        <html>
            <head><title>Docker Container Running</title></head>
            <body>
                <h1>Your Docker container is running successfully!</h1>
                <p>Container hostname: {hostname}</p>
                <p>This is a simple web server running on port 8000.</p>
                <p>You can now modify this application with your actual code.</p>
            </body>
        </html>
        """
        self.wfile.write(html.encode())

def run_server(port=8000):
    print(f"Starting web server on port {port}...")
    print(f"Open http://localhost:{port} in your browser to view")
    server_address = ('', port)
    httpd = HTTPServer(server_address, SimpleHandler)
    httpd.serve_forever()

if __name__ == "__main__":
    run_server()
