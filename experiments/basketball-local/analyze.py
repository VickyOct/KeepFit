"""CPU baseline: detections, track segments and review cues, never official stats."""
from __future__ import annotations

import argparse
from collections import defaultdict
import hashlib
import json
import os
from pathlib import Path
import time
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parent
(ROOT / ".cache" / "ultralytics" / "Ultralytics").mkdir(parents=True, exist_ok=True)
os.environ.setdefault("YOLO_CONFIG_DIR", str(ROOT / ".cache" / "ultralytics"))
os.environ.setdefault("YOLO_OFFLINE", "true")
os.environ.setdefault("YOLO_AUTOINSTALL", "false")


def run(args):
    import cv2
    import numpy as np
    import torch
    from ultralytics import YOLO, settings
    from ultralytics.engine.results import Boxes
    from ultralytics.trackers.bot_sort import BOTSORT
    import yaml

    settings.update({"sync": False, "wandb": False, "mlflow": False})
    torch.set_num_threads(args.threads)
    cv2.setNumThreads(2)
    out = args.output.resolve()
    source_meta = json.loads(args.video.with_suffix(".json").read_text(encoding="utf-8"))
    if source_meta["video_id"] != args.video_id or source_meta["source_start_seconds"] != args.source_start:
        raise RuntimeError("Video file and requested source identity/time do not match")
    (out / "crops").mkdir(parents=True, exist_ok=True)
    (out / "frames").mkdir(exist_ok=True)
    cap = cv2.VideoCapture(str(args.video.resolve()))
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open {args.video}")
    source_fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width, height = int(cap.get(3)), int(cap.get(4))
    if source_fps <= 0 or total_frames <= 0:
        raise RuntimeError("Invalid video metadata")
    duration = min(args.duration, total_frames / source_fps)
    step = max(1, round(source_fps / args.fps))
    model = YOLO(str(args.model.resolve()))
    tracker = BOTSORT(SimpleNamespace(**yaml.safe_load((ROOT / "tracker_camera.yaml").read_text())))
    model.predict(np.zeros((height, width, 3), np.uint8), imgsz=args.imgsz,
                  device="cpu", verbose=False, classes=[0, 32])
    tracks = defaultdict(lambda: {"samples": 0, "red": [], "crops": [], "cues": []})
    frames, cues, inference_ms = [], [], []
    last_cue = defaultdict(lambda: -100.0)
    next_still, frame_no = 0.0, 0
    ball_frames = 0
    started = time.perf_counter()
    while frame_no < min(total_frames, int(duration * source_fps)):
        ok = cap.grab()
        if not ok:
            break
        if frame_no % step:
            frame_no += 1
            continue
        ok, im = cap.retrieve()
        if not ok:
            break
        t = frame_no / source_fps
        result = model.predict(im, classes=[0, 32], conf=0.10, iou=0.5, imgsz=args.imgsz,
                               device="cpu", verbose=False)[0]
        inference_ms.append(sum(result.speed.values()))
        people, balls = [], []
        # Keep raw ball detections: rapid ball motion does not need to survive a person tracker.
        det = result.boxes.cpu().numpy()
        tracked = tracker.update(det[det.cls == 0], im)
        raw_balls = det[det.cls == 32]
        combined = []
        if len(tracked):
            combined.extend(tracked[:, :-1].tolist())
        for b in raw_balls:
            combined.append([*b.xyxy[0].tolist(), -1, float(b.conf[0]), 32])
        boxes = Boxes(np.asarray(combined, dtype=np.float32).reshape(-1, 7), im.shape[:2])
        for box in boxes:
            x1, y1, x2, y2 = np.rint(box.xyxy[0]).astype(int).tolist()
            x1, y1, x2, y2 = max(0, x1), max(0, y1), min(width, x2), min(height, y2)
            bw, bh = x2 - x1, y2 - y1
            conf = round(float(box.conf[0]), 3)
            if bw <= 0 or bh <= 0:
                continue
            if int(box.cls[0]) == 32:
                if conf >= 0.15 and y2 > height * 0.18 and 0.35 < bw / bh < 2.8 and max(bw, bh) < width * 0.07:
                    balls.append({"box": [x1, y1, x2, y2], "confidence": conf})
                continue
            if box.id is None or bh < height * 0.045 or y2 < height * 0.30:
                continue
            tid = int(box.id[0])
            torso = im[y1 + int(bh * 0.18):y1 + int(bh * 0.58), x1 + int(bw * .22):x1 + int(bw * .78)]
            red = 0.0
            if torso.size:
                hsv = cv2.cvtColor(torso, cv2.COLOR_BGR2HSV)
                red = float((((hsv[:, :, 0] < 9) | (hsv[:, :, 0] > 170)) &
                             (hsv[:, :, 1] > 65) & (hsv[:, :, 2] > 28)).mean())
            person = {"id": tid, "box": [x1, y1, x2, y2], "confidence": conf, "red_fraction": round(red, 3)}
            people.append(person)
            track = tracks[tid]
            if not track["samples"]:
                track["start"] = round(t, 3)
            track["end"] = round(t, 3)
            track["samples"] += 1
            track["red"].append(red)
            # Keep multiple actual views; a good crop is not proof of identity.
            crop = im[max(0, y1 - 8):min(height, y2 + 8), max(0, x1 - 8):min(width, x2 + 8)]
            score = bh * conf
            if (not track["crops"] or min(abs(t - c["time"]) for c in track["crops"]) > 2.5):
                if len(track["crops"]) < 4 or score > min(c["score"] for c in track["crops"]):
                    entry = {"time": round(t, 3), "score": score, "image": crop.copy(), "box": person["box"]}
                    track["crops"].append(entry)
                    track["crops"] = sorted(track["crops"], key=lambda c: c["score"], reverse=True)[:4]
        if balls:
            ball_frames += 1
        for ball in balls:
            bx1, by1, bx2, by2 = ball["box"]
            bx, by = (bx1 + bx2) / 2, (by1 + by2) / 2
            nearby = []
            for p in people:
                x1, y1, x2, y2 = p["box"]
                ph = y2 - y1
                if x1 - ph * .3 <= bx <= x2 + ph * .3 and y1 - ph * .5 <= by <= y1 + ph * .48:
                    nearby.append((abs(bx - (x1 + x2) / 2) / ph + abs(by - y1) / ph, p))
            if nearby:
                _, p = min(nearby, key=lambda item: item[0])
                tid = p["id"]
                if t - last_cue[tid] >= 4:
                    cue = {"id": f"cue-{len(cues) + 1}", "time": round(t, 3), "track_id": tid,
                           "reason": "篮球接近肩部或头部；可能是接球、传球或投篮，尚未分类。",
                           "status": "unreviewed", "ball_confidence": ball["confidence"]}
                    cues.append(cue)
                    tracks[tid]["cues"].append(cue["id"])
                    last_cue[tid] = t
        frames.append({"time": round(t, 3), "people": people, "balls": balls})
        if t >= next_still:
            still = im.copy()
            for p in people:
                x1, y1, x2, y2 = p["box"]
                color = (80, 190, 255) if p["red_fraction"] > .12 else (230, 220, 90)
                cv2.rectangle(still, (x1, y1), (x2, y2), color, 2)
                cv2.putText(still, f'T{p["id"]}', (x1, max(18, y1 - 6)), cv2.FONT_HERSHEY_SIMPLEX, .7, color, 2)
            for b in balls:
                x1, y1, x2, y2 = b["box"]
                cv2.rectangle(still, (x1, y1), (x2, y2), (80, 250, 80), 2)
            cv2.imwrite(str(out / "frames" / f"{int(t):04d}.jpg"), still, [cv2.IMWRITE_JPEG_QUALITY, 90])
            next_still += 30
        if len(frames) % 100 == 0:
            elapsed = time.perf_counter() - started
            print(json.dumps({"sampled_frames": len(frames), "video_seconds": round(t, 1), "elapsed_seconds": round(elapsed, 1)}), flush=True)
        frame_no += 1
    cap.release()
    elapsed = time.perf_counter() - started
    summaries = []
    for tid, tr in tracks.items():
        crop_info = []
        for i, crop in enumerate(sorted(tr["crops"], key=lambda c: c["time"])):
            name = f"crops/track_{tid}_{i}.jpg"
            cv2.imwrite(str(out / name), crop["image"], [cv2.IMWRITE_JPEG_QUALITY, 95])
            crop_info.append({"time": crop["time"], "path": name, "box": crop["box"]})
        summaries.append({"id": tid, "start": tr["start"], "end": tr["end"], "samples": tr["samples"],
                          "red_fraction": round(float(np.median(tr["red"])), 3), "crops": crop_info, "cue_ids": tr["cues"]})
    meta = {"schema_version": 1, "video_id": args.video_id, "target": "Wolf · 红衣 7 号",
            "source_url": f"https://www.youtube.com/watch?v={args.video_id}", "source_start_seconds": args.source_start,
            "video_path": Path(os.path.relpath(args.video.resolve(), out)).as_posix(),
            "width": width, "height": height, "source_fps": source_fps,
            "duration_seconds": round(min(frame_no / source_fps, duration), 3), "sample_fps": source_fps / step,
            "sampled_frames": len(frames), "ball_detected_frames": ball_frames,
            "ball_detection_frame_fraction": round(ball_frames / max(1, len(frames)), 4),
            "elapsed_seconds": round(elapsed, 2), "processing_fps": round(len(frames) / max(.001, elapsed), 2),
            "mean_model_ms": round(float(np.mean(inference_ms)), 2) if inference_ms else None,
            "model": args.model.name, "model_sha256": hashlib.sha256(args.model.read_bytes()).hexdigest(),
            "device": "cpu", "threads": args.threads, "imgsz": args.imgsz,
            "tracker": "BoT-SORT with sparse optical-flow camera compensation", "ball_source": "raw detections before tracking",
            "identity_status": "needs_human_confirmation", "automatic_statistics": None,
            "limitations": ["轨迹编号不是球衣号码，同一轨迹也可能发生身份交换。", "篮球出现比例不是检测准确率或召回率。",
                            "候选提示没有识别命中、两分/三分、罚球或助攻。", "未检测到事件不等于该事件没有发生；需要检查完整片段。",
                            "片段无音频；犯规、违例与有效得分需人工确认。"]}
    payload = {"meta": meta, "tracks": summaries, "frames": frames, "cues": cues}
    (out / "analysis.json").write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (out / "data.js").write_text("window.TRIAL_DATA=" + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";", encoding="utf-8")
    print(json.dumps({"complete": True, "output": str(out), "meta": meta, "track_segments": len(summaries), "review_cues": len(cues)}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", type=Path, default=ROOT / "data" / "sYWx1qcIapE_300_600.mp4")
    parser.add_argument("--video-id", default="sYWx1qcIapE")
    parser.add_argument("--model", type=Path, default=ROOT / "models" / "yolo26n.pt")
    parser.add_argument("--output", type=Path, default=ROOT / "runs" / "baseline")
    parser.add_argument("--source-start", type=float, default=300)
    parser.add_argument("--duration", type=float, default=300)
    parser.add_argument("--fps", type=float, default=5)
    parser.add_argument("--imgsz", type=int, default=960)
    parser.add_argument("--threads", type=int, default=6)
    options = parser.parse_args()
    if options.fps <= 0 or options.duration <= 0 or options.threads <= 0:
        parser.error("fps, duration and threads must be positive")
    run(options)
