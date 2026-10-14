$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$revision = 'a859101d633a01c4a1a920d6a8ce41dabba0705f'
$sourceRoot = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/$revision/exercises"
$exerciseImages = [ordered]@{
  'machine-chest-press' = 'Leverage_Chest_Press'
  'pec-deck' = 'Butterfly'
  'dumbbell-bench-press' = 'Dumbbell_Bench_Press'
  'barbell-bench-press' = 'Barbell_Bench_Press_-_Medium_Grip'
  'push-up' = 'Pushups'
  'lat-pulldown' = 'Wide-Grip_Lat_Pulldown'
  'seated-cable-row' = 'Seated_Cable_Rows'
  'one-arm-dumbbell-row' = 'One-Arm_Dumbbell_Row'
  'straight-arm-pulldown' = 'Straight-Arm_Pulldown'
  'leg-press' = 'Leg_Press'
  'leg-extension' = 'Leg_Extensions'
  'seated-leg-curl' = 'Seated_Leg_Curl'
  'lying-leg-curl' = 'Lying_Leg_Curls'
  'smith-squat' = 'Smith_Machine_Squat'
  'romanian-deadlift' = 'Romanian_Deadlift'
  'bodyweight-squat' = 'Bodyweight_Squat'
  'dumbbell-lunge' = 'Dumbbell_Lunges'
  'seated-calf-raise' = 'Seated_Calf_Raise'
  'dumbbell-shoulder-press' = 'Dumbbell_Shoulder_Press'
  'lateral-raise' = 'Side_Lateral_Raise'
  'face-pull' = 'Face_Pull'
  'seated-dumbbell-curl' = 'Seated_Dumbbell_Curl'
  'hammer-curl' = 'Hammer_Curls'
  'rope-triceps-pushdown' = 'Triceps_Pushdown_-_Rope_Attachment'
  'dumbbell-overhead-triceps-extension' = 'Seated_Triceps_Press'
  'plank' = 'Plank'
  'crunch' = 'Crunches'
  'reverse-crunch' = 'Reverse_Crunch'
  'treadmill-walk' = 'Walking_Treadmill'
  'stationary-bike' = 'Bicycling_Stationary'
}

foreach ($entry in $exerciseImages.GetEnumerator()) {
  foreach ($frame in 0, 1) {
    $destination = Join-Path $PSScriptRoot "$($entry.Key)-$frame.jpg"
    if (Test-Path -LiteralPath $destination) { continue }
    Invoke-WebRequest -Uri "$sourceRoot/$($entry.Value)/$frame.jpg" -OutFile $destination
  }
}
Get-ChildItem -LiteralPath $PSScriptRoot -Filter '*.jpg' | Measure-Object -Property Length -Sum | Select-Object Count, Sum
