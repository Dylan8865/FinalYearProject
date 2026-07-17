# ci/parse_scene_assets.ps1
# Parses experiment.unity and reports:
#   • Every GameObject (root & children)
#   • All components / MonoBehaviour class names
#   • All asset references resolved to filenames (Mesh, Material, Sprite, Prefab, Font, etc.)
# Run from project root: powershell -ExecutionPolicy Bypass -NoProfile -File "ci\parse_scene_assets.ps1"

$ScenePath  = "c:\Users\Yong Chao Juin\Unity Project\Tester\Assets\_Recovery\experiment.unity"
$AssetsRoot = "c:\Users\Yong Chao Juin\Unity Project\Tester\Assets"

# ── Unity class ID → readable type ───────────────────────────────────────────
$ClassMap = @{
    "1"   = "GameObject";  "4"   = "Transform";   "20"  = "Camera"
    "23"  = "MeshRenderer";"33"  = "MeshFilter";  "54"  = "Rigidbody2D"
    "61"  = "BoxCollider2D";"65"  = "BoxCollider"; "81"  = "AudioListener"
    "82"  = "AudioSource"; "108" = "Light";        "114" = "MonoBehaviour"
    "120" = "LineRenderer";"136" = "SkinnedMeshRenderer"
    "198" = "ParticleSystem";"199"= "ParticleSystemRenderer"
    "212" = "SpriteRenderer";"222"= "CanvasRenderer";"223"= "Canvas"
    "224" = "RectTransform";"225"= "Animator";    "281" = "EventSystem"
    "59"  = "Collider";    "143" = "ReflectionProbe"
}

# ── Step 1: Build GUID → asset filename map from .meta files ─────────────────
Write-Host "Building GUID lookup from .meta files..." -ForegroundColor Cyan
$guidMap = @{}
$guidPattern = '^\s*guid:\s*([a-f0-9]{32})'

Get-ChildItem $AssetsRoot -Recurse -Filter "*.meta" | ForEach-Object {
    $metaFile = $_
    $assetName = [System.IO.Path]::GetFileNameWithoutExtension($metaFile.Name)  # strip .meta, keep .png etc
    $assetName = [System.IO.Path]::GetFileNameWithoutExtension($assetName)      # strip actual extension too
    $firstLine = Get-Content $metaFile.FullName -TotalCount 5
    foreach ($ln in $firstLine) {
        if ($ln -match $guidPattern) {
            $guidMap[$matches[1]] = $assetName
            break
        }
    }
}
Write-Host "  Resolved $($guidMap.Count) GUIDs." -ForegroundColor Green
Write-Host ""

# ── Step 2: Parse the scene file ─────────────────────────────────────────────
$lines = Get-Content $ScenePath -Encoding UTF8

# Patterns
$sectionPat     = '^--- !u!(\d+) &(\d+)'
$namePat        = '^\s+m_Name:\s*(.+)$'
$fatherPat      = '^\s+m_Father:\s*\{fileID:\s*(\d+)\}'
$editorClassPat = '^\s+m_EditorClassIdentifier:\s*(.+)$'
$componentPat   = '^\s+-\s*component:\s*\{fileID:\s*(\d+)\}'
$gameObjectPat  = '^\s+m_GameObject:\s*\{fileID:\s*(\d+)\}'
# Asset reference: any line with a GUID that isn't a script reference (fileID != 11500000)
$assetRefPat    = '^\s+(\w+):\s*\{fileID:\s*(?!0\b)(\d+),\s*guid:\s*([a-f0-9]{32}),\s*type:\s*([^}]+)\}'
$materialsInPat = '^\s+-\s*\{fileID:\s*(?!0\b)(\d+),\s*guid:\s*([a-f0-9]{32}),\s*type:\s*([^}]+)\}'

$objects   = @{}
$current   = $null

foreach ($line in $lines) {
    if ($line -match $sectionPat) {
        $classID  = $matches[1]
        $fileID   = $matches[2]
        $typeName = if ($ClassMap.ContainsKey($classID)) { $ClassMap[$classID] } else { "Type$classID" }
        $current  = @{
            ClassID    = $classID
            FileID     = $fileID
            Type       = $typeName
            Name       = ""
            Father     = "0"
            MonoClass  = ""
            OwnerGO    = ""
            Components = [System.Collections.Generic.List[string]]::new()
            Assets     = [System.Collections.Generic.List[string]]::new()
        }
        $objects[$fileID] = $current
        continue
    }
    if ($null -eq $current) { continue }

    if ($line -match $namePat)        { $current.Name     = $matches[1].Trim() }
    if ($line -match $fatherPat)      { $current.Father   = $matches[1] }
    if ($line -match $editorClassPat) { $current.MonoClass= $matches[1].Trim() }
    if ($line -match $gameObjectPat)  { $current.OwnerGO  = $matches[1] }
    if ($line -match $componentPat)   { $current.Components.Add($matches[1]) }

    # Capture asset refs (exclude MonoScript fileID 11500000)
    if ($line -match $assetRefPat) {
        $fieldName = $matches[1]
        $fid       = $matches[2]
        $guid      = $matches[3]
        if ($fid -ne "11500000" -and $guid -ne "0000000000000000f000000000000000" -and $guid -ne "0000000000000000e000000000000000") {
            $assetName = if ($guidMap.ContainsKey($guid)) { $guidMap[$guid] } else { "guid:$guid" }
            $current.Assets.Add("${fieldName}: ${assetName}")
        }
    }
    if ($line -match $materialsInPat) {
        $guid      = $matches[2]
        if ($guid -ne "0000000000000000f000000000000000") {
            $assetName = if ($guidMap.ContainsKey($guid)) { $guidMap[$guid] } else { "guid:$guid" }
            $current.Assets.Add("Material: ${assetName}")
        }
    }
}

# ── Step 3: Build GO map with parent resolution ───────────────────────────────
$goMap = @{}
foreach ($kv in $objects.GetEnumerator()) {
    if ($kv.Value.ClassID -eq "1") {
        $go = $kv.Value
        $goMap[$go.FileID] = @{
            Name       = $go.Name
            Father     = "0"
            CompLabels = [System.Collections.Generic.List[string]]::new()
            AssetLines = [System.Collections.Generic.List[string]]::new()
        }
    }
}

# Resolve parent GO from Transform.m_Father
foreach ($kv in $objects.GetEnumerator()) {
    $obj = $kv.Value
    if ($obj.ClassID -eq "4" -or $obj.ClassID -eq "224") {
        $ownerGO     = $obj.OwnerGO
        $fatherXform = $obj.Father
        if ($goMap.ContainsKey($ownerGO)) {
            if ($fatherXform -ne "0" -and $objects.ContainsKey($fatherXform)) {
                $parentGOid = $objects[$fatherXform].OwnerGO
                $goMap[$ownerGO].Father = $parentGOid
            }
        }
    }
}

# Resolve components & assets per GO
foreach ($kv in $goMap.GetEnumerator()) {
    $goID = $kv.Key
    $go   = $kv.Value
    if (-not $objects.ContainsKey($goID)) { continue }
    $goObj = $objects[$goID]

    foreach ($compID in $goObj.Components) {
        if (-not $objects.ContainsKey($compID)) { continue }
        $comp = $objects[$compID]
        if ($comp.ClassID -eq "1")                                    { continue }
        if ($comp.ClassID -eq "4" -or $comp.ClassID -eq "224")        { continue }

        # Component label
        if ($comp.ClassID -eq "114" -and $comp.MonoClass -ne "") {
            $go.CompLabels.Add("Script: $($comp.MonoClass)")
        } else {
            $go.CompLabels.Add($comp.Type)
        }

        # Assets referenced by this component
        foreach ($asset in $comp.Assets) {
            $go.AssetLines.Add($asset)
        }
    }
}

# ── Step 4: Print report ──────────────────────────────────────────────────────
$roots = $goMap.GetEnumerator() | Where-Object { $_.Value.Father -eq "0" } | Sort-Object { $_.Value.Name }
$total = $goMap.Count

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  SCENE: experiment.unity" -ForegroundColor Cyan
Write-Host "  Root GameObjects: $($roots.Count)   Total GOs: $total" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

function Print-GO($goID, $depth) {
    if (-not $goMap.ContainsKey($goID)) { return }
    $go      = $goMap[$goID]
    $indent  = "  " * $depth
    $marker  = if ($depth -eq 0) { "▶" } else { "  " * ($depth - 1) + "  └─" }
    $active  = ""
    Write-Host "${indent}${marker} $($go.Name)" -ForegroundColor Yellow

    foreach ($c in $go.CompLabels) {
        Write-Host "${indent}      [Component] $c" -ForegroundColor Cyan
    }
    foreach ($a in $go.AssetLines | Select-Object -Unique) {
        Write-Host "${indent}      [Asset]     $a" -ForegroundColor Green
    }

    $children = $goMap.GetEnumerator() | Where-Object { $_.Value.Father -eq $goID } | Sort-Object { $_.Value.Name }
    foreach ($child in $children) { Print-GO $child.Key ($depth + 1) }
}

foreach ($root in $roots) {
    Print-GO $root.Key 0
    Write-Host ""
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Done — $total GameObjects listed." -ForegroundColor Green
