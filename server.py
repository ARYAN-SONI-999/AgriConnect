import http.server
import socketserver
import json
import time

PORT = 3000
DB_FILE = 'db.json'

class AgriHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/products':
            try:
                with open(DB_FILE, 'r') as f:
                    data = json.load(f)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(data['products']).encode())
            except Exception as e:
                self.send_error(500, str(e))
        elif self.path == '/api/orders':
            try:
                with open(DB_FILE, 'r') as f:
                    data = json.load(f)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(data.get('orders', [])).encode())
            except Exception as e:
                self.send_error(500, str(e))
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/products':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                new_product = json.loads(post_data)

                with open(DB_FILE, 'r+') as f:
                    data = json.load(f)
                    
                    if 'id' not in new_product:
                        new_product['id'] = int(time.time() * 1000)
                    if 'products' not in data:
                        data['products'] = []

                    data['products'].append(new_product)
                    
                    f.seek(0)
                    json.dump(data, f, indent=4)
                    f.truncate()
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(new_product).encode())
            except Exception as e:
                self.send_error(500, str(e))

        elif self.path == '/api/orders':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                new_order = json.loads(post_data)

                with open(DB_FILE, 'r+') as f:
                    data = json.load(f)
                    
                    if 'id' not in new_order:
                        new_order['id'] = int(time.time() * 1000)
                    if 'orders' not in data:
                        data['orders'] = []

                    data['orders'].append(new_order)
                    
                    f.seek(0)
                    json.dump(data, f, indent=4)
                    f.truncate()
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(new_order).encode())
            except Exception as e:
                self.send_error(500, str(e))
        else:
            self.send_error(404)

    def do_PUT(self):
        if self.path.startswith('/api/products/'):
            try:
                product_id = int(self.path.split('/')[-1])
                content_length = int(self.headers['Content-Length'])
                put_data = self.rfile.read(content_length)
                updated_fields = json.loads(put_data)

                with open(DB_FILE, 'r+') as f:
                    data = json.load(f)
                    
                    found = False
                    # Find and update product
                    for product in data.get('products', []):
                        if product.get('id') == product_id:
                            product.update(updated_fields)
                            found = True
                            break
                    
                    if found:
                        f.seek(0)
                        json.dump(data, f, indent=4)
                        f.truncate()
                        
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        self.wfile.write(json.dumps({"success": True}).encode())
                    else:
                        self.send_error(404, "Product not found")

            except Exception as e:
                self.send_error(500, str(e))
        elif self.path.startswith('/api/orders/'):
            try:
                order_id = int(self.path.split('/')[-1])
                content_length = int(self.headers['Content-Length'])
                put_data = self.rfile.read(content_length)
                updated_fields = json.loads(put_data)

                with open(DB_FILE, 'r+') as f:
                    data = json.load(f)
                    
                    found = False
                    # Find and update order
                    for order in data.get('orders', []):
                        if order.get('id') == order_id:
                            order.update(updated_fields)
                            found = True
                            break
                    
                    if found:
                        f.seek(0)
                        json.dump(data, f, indent=4)
                        f.truncate()
                        
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        self.wfile.write(json.dumps({"success": True}).encode())
                    else:
                        self.send_error(404, "Order not found")

            except Exception as e:
                self.send_error(500, str(e))
        else:
            self.send_error(404)

    def do_DELETE(self):
        if self.path.startswith('/api/products/'):
            try:
                product_id = int(self.path.split('/')[-1])

                with open(DB_FILE, 'r+') as f:
                    data = json.load(f)
                    
                    products = data.get('products', [])
                    initial_len = len(products)
                    data['products'] = [p for p in products if p.get('id') != product_id]
                    
                    if len(data['products']) < initial_len:
                        f.seek(0)
                        json.dump(data, f, indent=4)
                        f.truncate()
                        
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        self.wfile.write(json.dumps({"success": True}).encode())
                    else:
                        self.send_error(404, "Product not found")
            except Exception as e:
                self.send_error(500, str(e))
        else:
            self.send_error(404)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

print(f"Python Server running on http://localhost:{PORT}")
print(f"Serving data from {DB_FILE}")

with socketserver.TCPServer(("", PORT), AgriHandler) as httpd:
    httpd.serve_forever()
