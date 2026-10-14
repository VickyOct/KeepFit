"""Read-only review server, bound to localhost, including video byte-range support."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_head(self):
        raw = unquote(urlsplit(self.path).path).lstrip("/") or "review.html"
        path = (ROOT / raw).resolve()
        try:
            relative = path.relative_to(ROOT)
        except ValueError:
            self.send_error(404)
            return None
        if not path.is_file() or not (raw in {"review.html", "review.js", "stats.js"} or
                relative.parts[0] in {"runs", "data"} and path.suffix in {".js", ".json", ".jpg", ".mp4"}):
            self.send_error(404)
            return None
        self.path = "/" + relative.as_posix()
        self._range = None
        if path.suffix != ".mp4" or "Range" not in self.headers:
            return super().send_head()
        size = path.stat().st_size
        match = re.fullmatch(r"bytes=(\d*)-(\d*)", self.headers["Range"])
        if not match or not any(match.groups()):
            self.send_error(416)
            return None
        left, right = match.groups()
        if left:
            start = int(left)
            end = min(int(right), size - 1) if right else size - 1
        else:
            start, end = max(0, size - int(right)), size - 1
        if start > end or start >= size:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None
        stream = path.open("rb")
        stream.seek(start)
        self._range = end - start + 1
        self.send_response(206)
        self.send_header("Content-Type", "video/mp4")
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(self._range))
        self.end_headers()
        return stream

    def copyfile(self, source, outputfile):
        try:
            if self._range is None:
                super().copyfile(source, outputfile)
            else:
                remaining = self._range
                while remaining:
                    chunk = source.read(min(remaining, 256 * 1024))
                    if not chunk:
                        break
                    outputfile.write(chunk)
                    remaining -= len(chunk)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass  # A browser may cancel its previous video range when seeking.


if __name__ == "__main__":
    print("Basketball review: http://127.0.0.1:8768/review.html", flush=True)
    ThreadingHTTPServer(("127.0.0.1", 8768), Handler).serve_forever()
