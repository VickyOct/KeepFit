"""Download one public match excerpt; never read browser cookies or upload video."""
import argparse
import json
from pathlib import Path
import shutil
import subprocess
import time

import imageio_ffmpeg
from yt_dlp import YoutubeDL

ROOT = Path(__file__).resolve().parent

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--video-id", default="sYWx1qcIapE")
    p.add_argument("--start", type=float, default=300)
    p.add_argument("--duration", type=float, default=300)
    args = p.parse_args()
    if args.start < 0 or args.duration <= 0:
        p.error("Invalid time range")
    url = f"https://www.youtube.com/watch?v={args.video_id}"
    with YoutubeDL({"format": "bestvideo[height<=1080][vcodec^=avc1]/bestvideo[height<=1080]",
                    "noplaylist": True, "quiet": True, "js_runtimes": {"node": {"path": shutil.which("node")}},
                    "cachedir": str(ROOT / ".cache" / "yt-dlp")}) as ydl:
        info = ydl.extract_info(url, download=False)
    if info["id"] != args.video_id:
        raise RuntimeError("Video identity mismatch")
    path = ROOT / "data" / f"{args.video_id}_{int(args.start)}_{int(args.start + args.duration)}.mp4"
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        raise RuntimeError(f"Output already exists: {path.name}")
    print(json.dumps({"title": info["title"], "match_duration": info["duration"],
                      "start": args.start, "duration": args.duration,
                      "resolution": [info.get("width"), info.get("height")]}, ensure_ascii=False), flush=True)
    started = time.perf_counter()
    cmd = [imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-loglevel", "error", "-ss", str(args.start),
           "-i", info["url"], "-t", str(args.duration), "-an", "-c:v", "libx264", "-preset", "veryfast",
           "-crf", "20", "-threads", "6", "-movflags", "+faststart", "-n", str(path)]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError("Video extraction failed; no complete sample is available.")
    meta = {"video_id": args.video_id, "title": info["title"], "source_url": url,
            "source_start_seconds": args.start, "requested_duration_seconds": args.duration,
            "source_duration_seconds": info["duration"], "width": info.get("width"), "height": info.get("height"),
            "source_fps": info.get("fps"), "audio": False, "format_id": info["format_id"],
            "download_seconds": round(time.perf_counter() - started, 2), "bytes": path.stat().st_size}
    path.with_suffix(".json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"complete": True, "file": str(path), "meta": meta}, ensure_ascii=False), flush=True)
