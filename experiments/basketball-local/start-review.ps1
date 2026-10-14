$trialRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$trialPython = Join-Path $trialRoot '.venv/Scripts/python.exe'
$trialServer = Join-Path $trialRoot 'serve.py'
$trialRunDir = Join-Path $trialRoot 'runs'
if (-not (Test-Path -LiteralPath (Join-Path $trialRunDir 'free-throw/analysis.json'))) {
    throw 'The local trial has not completed yet.'
}
$trialRunning = $false
try {
    $trialPage = Invoke-WebRequest -Uri 'http://127.0.0.1:8768/review.html' -TimeoutSec 2
    $trialRunning = $trialPage.Content.Contains('LOCAL BASKETBALL TRIAL')
} catch {}
if (-not $trialRunning) {
    $trialProcess = Start-Process -FilePath $trialPython -ArgumentList ('"' + $trialServer + '"') -WorkingDirectory $trialRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $trialRunDir 'server.out.log') -RedirectStandardError (Join-Path $trialRunDir 'server.err.log') -PassThru
    $trialProcess.Id | Set-Content -LiteralPath (Join-Path $trialRunDir 'server.pid')
}
Write-Output 'http://127.0.0.1:8768/review.html'
