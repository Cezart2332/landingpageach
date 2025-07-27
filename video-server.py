#!/usr/bin/env python3
import http.server
import socketserver
import mimetypes
import os

# Add proper MIME types for video files
mimetypes.add_type('video/mp4', '.mp4')
mimetypes.add_type('video/webm', '.webm')
mimetypes.add_type('video/ogg', '.ogg')

class VideoHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for video files
        if self.path.endswith(('.mp4', '.webm', '.ogg')):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Accept-Ranges', 'bytes')
            self.send_header('Content-Type', 'video/mp4')
        super().end_headers()
    
    def do_GET(self):
        # Handle range requests for video seeking
        if self.path.endswith(('.mp4', '.webm', '.ogg')):
            self.handle_video_request()
        else:
            super().do_GET()
    
    def handle_video_request(self):
        file_path = self.path.lstrip('/')
        if not os.path.exists(file_path):
            self.send_error(404)
            return
        
        file_size = os.path.getsize(file_path)
        range_header = self.headers.get('Range')
        
        if range_header:
            # Handle range request for video seeking
            ranges = range_header.replace('bytes=', '').split('-')
            start = int(ranges[0]) if ranges[0] else 0
            end = int(ranges[1]) if ranges[1] else file_size - 1
            
            self.send_response(206)
            self.send_header('Content-Type', 'video/mp4')
            self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
            self.send_header('Content-Length', str(end - start + 1))
            self.send_header('Accept-Ranges', 'bytes')
            self.end_headers()
            
            with open(file_path, 'rb') as f:
                f.seek(start)
                chunk_size = 8192
                bytes_to_read = end - start + 1
                while bytes_to_read > 0:
                    chunk = f.read(min(chunk_size, bytes_to_read))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    bytes_to_read -= len(chunk)
        else:
            # Normal request
            self.send_response(200)
            self.send_header('Content-Type', 'video/mp4')
            self.send_header('Content-Length', str(file_size))
            self.send_header('Accept-Ranges', 'bytes')
            self.end_headers()
            
            with open(file_path, 'rb') as f:
                self.wfile.write(f.read())

if __name__ == "__main__":
    PORT = 8000
    with socketserver.TCPServer(("", PORT), VideoHTTPRequestHandler) as httpd:
        print(f"🎥 Video-optimized server running at http://localhost:{PORT}/")
        print("This server properly handles MP4 files with correct MIME types and range requests")
        httpd.serve_forever()