# Exercise catalog and image sources

The original workout catalog contains 30 common movements with Chinese and English
exercise/equipment names. Photos are bundled in `assets/exercises` so the app
does not need an image API or an Internet connection to display the instructions.

## Source and license

- Dataset and photographs: [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db).
- Pinned revision: `a859101d633a01c4a1a920d6a8ce41dabba0705f` (checked 2026-09-12).
- [Repository README](https://github.com/yuhonas/free-exercise-db/blob/a859101d633a01c4a1a920d6a8ce41dabba0705f/README.md)
  explicitly permits checking out and using the JSON files and images locally.
- [License](https://github.com/yuhonas/free-exercise-db/blob/a859101d633a01c4a1a920d6a8ce41dabba0705f/LICENSE.md):
  Unlicense / public-domain dedication, as declared by the upstream repository.
- The upstream credits Ollie Jennings and `exercises.json` for the original dataset.
- Each app entry links directly to its pinned source JSON using `sourceUrl`.
- Image file URLs follow
  `https://raw.githubusercontent.com/yuhonas/free-exercise-db/<revision>/exercises/<source-id>/<frame>.jpg`.

`assets/exercises/download-sources.ps1` records the exact source-to-local mapping
and can fetch missing image files from the pinned revision. It does not run in
the mobile app. Existing downloaded files are left untouched.

## Content adaptation

Chinese names and explanations are written for this app. Instructions summarize
the matching exercise variant and add setup, controlled movement, muscle cues,
and common mistakes. They do not prescribe a training program or target load.
Equipment should be adjusted to the person and the particular machine.

Some older upstream text gives universal angle limits, says knees must never
pass toes, or encourages forced joint locking and prolonged breath-holding.
Those statements are not carried into the app. The app uses a comfortable,
controlled range of motion, stable support, and normal breathing cues.

The photographs illustrate the exercise, not a requirement to copy the model's
exact joint angles or use the pictured load. Text cues remain relevant when a
photo includes a raised head or other individual positioning. Beginner users
should have a gym trainer help adjust unfamiliar equipment and safety stops.

## Catalog mapping

| App ID | Exact upstream ID |
| --- | --- |
| machine-chest-press | Leverage_Chest_Press |
| pec-deck | Butterfly |
| dumbbell-bench-press | Dumbbell_Bench_Press |
| barbell-bench-press | Barbell_Bench_Press_-_Medium_Grip |
| push-up | Pushups |
| lat-pulldown | Wide-Grip_Lat_Pulldown |
| seated-cable-row | Seated_Cable_Rows |
| one-arm-dumbbell-row | One-Arm_Dumbbell_Row |
| straight-arm-pulldown | Straight-Arm_Pulldown |
| leg-press | Leg_Press |
| leg-extension | Leg_Extensions |
| seated-leg-curl | Seated_Leg_Curl |
| lying-leg-curl | Lying_Leg_Curls |
| smith-squat | Smith_Machine_Squat |
| romanian-deadlift | Romanian_Deadlift |
| bodyweight-squat | Bodyweight_Squat |
| dumbbell-lunge | Dumbbell_Lunges |
| seated-calf-raise | Seated_Calf_Raise |
| dumbbell-shoulder-press | Dumbbell_Shoulder_Press |
| lateral-raise | Side_Lateral_Raise |
| face-pull | Face_Pull |
| seated-dumbbell-curl | Seated_Dumbbell_Curl |
| hammer-curl | Hammer_Curls |
| rope-triceps-pushdown | Triceps_Pushdown_-_Rope_Attachment |
| dumbbell-overhead-triceps-extension | Seated_Triceps_Press |
| plank | Plank |
| crunch | Crunches |
| reverse-crunch | Reverse_Crunch |
| treadmill-walk | Walking_Treadmill |
| stationary-bike | Bicycling_Stationary |

Each entry uses source frames `0.jpg` and `1.jpg`, except Plank. The upstream
`Plank/0.jpg` is a half-kneeling preparation pose, not the hold itself, so the
app displays only `Plank/1.jpg`. There are 59 displayed demonstration photos.
Image captions do not assume that upstream frame 0 is always the start position.

## Technical references and diagram review — 2026-09-25

The catalog now contains **50 exercises**: the original 30 with 59 bundled
photographs, plus 20 text-only guides in `src/data/diagramExercises.ts`.
The additional guides use empty image arrays and explicitly show that no photo
is available; they never borrow a photograph from another exercise variant.
The supplied social-media screenshots are not bundled as technical illustrations.

Each exercise has an exact pinned source entry, presented as **community exercise
data**, not expert certification. All 50 entry IDs were checked against the pinned
repository's `dist/exercises.json`. Chinese steps are adaptations, not verbatim
translations. Additional references in `src/data/exerciseReferences.ts` distinguish
ACE technique/anatomy articles from research. Check dates mean source checking,
not clinical review or a guarantee that linked sites will remain available.

Known limitations in the community data are not carried into the guides: e.g.
some secondary-muscle labels are imprecise, squat entries say knees must not pass
toes, upright-row entries require pulling to the chin, and calf-raise text claims
precise muscle targeting from foot rotation. The new guides emphasize controlled
individual range of motion and do not prescribe those universal rules.

“提拉” is interpreted explicitly as upright row, not silently equated with high
pulls. The small abdominal-side label cannot establish a precise movement:
dumbbell side bend is provided as a separate reference, not a confirmed match.
Stiff-legged deadlift and RDL naming overlaps across sources; the precise variant
described by the text takes priority. Back extension uses a neutral-spine hip-hinge
variant. Research on regional EMG is not presented as proof of long-term growth.

| App ID | Exact upstream ID |
| --- | --- |
| incline-dumbbell-press | Incline_Dumbbell_Press |
| parallel-bar-dip | Dips_-_Chest_Version |
| dumbbell-shrug | Dumbbell_Shrug |
| dumbbell-front-raise | Front_Dumbbell_Raise |
| upright-row | Upright_Barbell_Row |
| reverse-grip-barbell-row | Reverse_Grip_Bent-Over_Rows |
| back-extension | Hyperextensions_Back_Extensions |
| standing-dumbbell-curl | Dumbbell_Bicep_Curl |
| reverse-barbell-curl | Reverse_Barbell_Curl |
| dumbbell-side-bend | Dumbbell_Side_Bend |
| hanging-leg-raise | Hanging_Leg_Raise |
| barbell-hip-thrust | Barbell_Hip_Thrust |
| hip-abduction | Thigh_Abductor |
| hip-adduction | Thigh_Adductor |
| barbell-squat | Barbell_Squat |
| wide-stance-squat | Wide_Stance_Barbell_Squat |
| sumo-deadlift | Sumo_Deadlift |
| stiff-leg-deadlift | Stiff-Legged_Barbell_Deadlift |
| smith-calf-raise | Smith_Machine_Calf_Raise |
| standing-dumbbell-calf-raise | Standing_Dumbbell_Calf_Raise |

See [the Chinese diagram review](exercise-diagram-review.md) for the corrections
and supporting references. App navigation and offline data are tested separately
from external links, whose failure shows a retry message without losing a workout.
