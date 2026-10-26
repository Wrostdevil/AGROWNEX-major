# Agrownex end-to-end smoke check (Windows PowerShell 5.1+).
#
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\smoke-api.ps1
#
# Starts nothing itself; run the three services first:
#   1. backend  : cd backend && npm run dev          (port 5000)
#   2. ml       : cd ml-service && .venv\Scripts\Activate.ps1; uvicorn app.main:app --port 8000
#   3. frontend : npm run dev                        (port 5173)
#
# The script reports PASS/FAIL per probe. DB-dependent probes are expected to
# return 503 when MongoDB is not installed — that is the system being honest,
# which this script treats as PASS (with an explicit DEGRADED note).

$ErrorActionPreference = 'Stop'
$backend = 'http://127.0.0.1:5000'
$ml      = 'http://127.0.0.1:8000'

$failures = 0
function Check($name, $ok, $detail) {
  $mark = if ($ok) { 'PASS' } else { $failures++; 'FAIL' }
  Write-Host "[$mark] $name :: $detail"
}

function ProbeJson($url, $method = 'GET', $body = $null) {
  try {
    if ($body) {
      return Invoke-RestMethod -Uri $url -Method $method -ContentType 'application/json' -Body $body -TimeoutSec 30
    }
    return Invoke-RestMethod -Uri $url -Method $method -TimeoutSec 30
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      $status = [int]$resp.StatusCode
      $reader = New-Object IO.StreamReader($resp.GetResponseStream())
      $text = $reader.ReadToEnd()
      return @{ __status = $status; __body = $text }
    }
    return @{ __status = 0; __body = $_.Exception.Message }
  }
}

Write-Host "== 1. ML service =="
$mi = ProbeJson "$ml/model/info"
if ($mi -is [hashtable] -and $mi.ContainsKey('__status')) {
  Check 'ml/model/info reachable' $false "$($mi.__status) $($mi.__body)"
} else {
  Check 'ml/model/info reachable' $true "trained=$($mi.model.trained) model=$($mi.model.name)"
  $predictBody = '{"crop_id":"tomato","symptom_ids":["leaf-brown-spots","leaf-yellowing"],"environment":{"humidity":"high","recentRainfall":"moderate"}}'
  $px = ProbeJson "$ml/predict-and-explain" 'POST' $predictBody
  if ($px -is [hashtable] -and $px.ContainsKey('__status')) {
    $expected503 = ($px.__status -eq 503 -and $px.__body -match 'MODEL_UNAVAILABLE')
    Check 'ml/predict-and-explain' $expected503 "status $($px.__status) (503 with MODEL_UNAVAILABLE is the honest no-artifacts answer)"
  } else {
    $namesOk = ($px.features.Count -gt 0 -and ($px.features | ForEach-Object { $_.label }) -notcontains $null)
    Check 'ml/predict-and-explain' $namesOk "condition=$($px.conditionId) confidence=$($px.confidence) method=$($px.method) features=$($px.features.Count) baseline=$($px.baseline)"
  }
}

Write-Host "== 2. Express backend =="
$h = ProbeJson "$backend/api/health"
if ($h -is [hashtable] -and $h.ContainsKey('__status')) {
  Check 'backend health reachable' $false "$($h.__status) $($h.__body)"
} else {
  Check 'backend health reachable' $true "status=$($h.status) db=$($h.db.state) ml.trained=$($h.ml.trained)"
  if ($h.status -eq 'degraded') {
    Write-Host "       (degraded is expected while MongoDB is not installed / model artifacts missing)"
  }
}

$t = ProbeJson "$backend/api/treatments"
if ($t -is [hashtable] -and $t.ContainsKey('__status')) {
  Check 'backend treatments list' $false "$($t.__status)"
} else {
  Check 'backend treatments list' ($t.count -gt 0) "count=$($t.count) (bundled fallback when DB is absent)"
}

$rank = ProbeJson "$backend/api/treatments/rank" 'POST' '{"budget":500}'
if ($rank -is [hashtable] -and $rank.ContainsKey('__status')) {
  Check 'backend treatments rank' $false "$($rank.__status)"
} else {
  $top = $rank.ranked | Select-Object -First 1
  Check 'backend treatments rank' ($rank.ranked.Count -gt 0) "top=$($top.name) score=$($top.score)"
}

# Without MongoDB these two MUST answer 503 with setup instructions — honest rejection.
$dx = ProbeJson "$backend/api/diagnoses" 'POST' '{"cropId":"tomato","symptomIds":["leaf-brown-spots"]}'
$dxStatus = if ($dx -is [hashtable]) { $dx.__status } else { 200 }
Check 'backend diagnoses honesty (503 without DB+ML storage)' ($dxStatus -eq 503) "status=$dxStatus — refuses to fake persistence"

$ax = ProbeJson "$backend/api/assistant/messages" 'POST' '{"message":"treatment options under 600"}'
$axStatus = if ($ax -is [hashtable]) { $ax.__status } else { 200 }
Check 'backend assistant honesty (503 without conversation storage)' ($axStatus -eq 503) "status=$axStatus — orchestration needs the DB for conversation state"

Write-Host ""
if ($failures -eq 0) {
  Write-Host 'SMOKE OK — all probes behaved as documented.' -ForegroundColor Green
} else {
  Write-Host "SMOKE FINISHED WITH $failures FAILURE(S)." -ForegroundColor Red
  exit 1
}
