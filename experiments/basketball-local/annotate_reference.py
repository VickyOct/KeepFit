"""Associate the user's 31:19 free-throw reference with the observed shooter box.

The point (833, 522) was selected by visual inspection of the 1920x1080
reference frame. This is a human reference, not jersey OCR or a made-shot label.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RUN = ROOT / "runs" / "free-throw"

if __name__ == "__main__":
    import cv2
    d = json.loads((RUN / "analysis.json").read_text(encoding="utf-8"))
    assert d["meta"]["video_id"] == "sYWx1qcIapE"
    relative_time = 1879 - d["meta"]["source_start_seconds"]
    frame = min(d["frames"], key=lambda f: abs(f["time"] - relative_time))
    assert abs(frame["time"] - relative_time) < .15
    matches = [p for p in frame["people"] if p["box"][0] <= 833 <= p["box"][2] and p["box"][1] <= 522 <= p["box"][3]]
    assert len(matches) == 1
    person = matches[0]
    d["meta"]["reference"] = {"source_time": 1879, "time": relative_time, "track_id": person["id"],
        "box": person["box"], "provenance": "User identified the free-throw shooter at 31:19; box selected by visual inspection",
        "identity_status": "reference_frame_identified; remainder_of_track_needs_review", "shot_result": "unreviewed"}
    d["meta"]["identity_status"] = "human_reference_available; full_track_needs_review"
    d["cues"] = [c for c in d["cues"] if c["id"] != "user-reference-3119"]
    d["cues"].append({"id": "user-reference-3119", "time": relative_time, "track_id": person["id"],
        "reason": "用户提供：31:19 红衣 7 号罚篮。需另行核对出手时间和命中结果。",
        "status": "unreviewed", "origin": "user_reference", "ball_confidence": None})
    d["cues"].sort(key=lambda c: c["time"])
    encoded = json.dumps(d, ensure_ascii=False, separators=(",", ":"))
    (RUN / "analysis.json").write_text(encoded, encoding="utf-8")
    (RUN / "data.js").write_text("window.TRIAL_DATA=" + encoded + ";", encoding="utf-8")
    cap = cv2.VideoCapture(str((RUN / d["meta"]["video_path"]).resolve()))
    cap.set(cv2.CAP_PROP_POS_MSEC, relative_time * 1000)
    ok, image = cap.read()
    assert ok
    x1, y1, x2, y2 = person["box"]
    cv2.rectangle(image, (x1, y1), (x2, y2), (105, 240, 150), 4)
    cv2.putText(image, f'Wolf #7 - user reference - T{person["id"]}', (x1 - 180, y1 - 22), cv2.FONT_HERSHEY_SIMPLEX, .85, (105, 240, 150), 2)
    cv2.imwrite(str(RUN / "reference_identified.jpg"), image)
    cap.release()
    print(json.dumps(d["meta"]["reference"]))
