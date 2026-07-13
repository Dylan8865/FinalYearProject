# parse_scene.ps1 — Parse a Unity .unity scene file and report:
#   • All root GameObjects
#   • All child GameObjects
#   • Components on each (type name + MonoBehaviour class identifier)

$ScenePath = "c:\Users\Yong Chao Juin\Unity Project\Tester\Assets\_Recovery\experiment.unity"

# ── Unity class ID → readable type name map ──────────────────────────────────
$ClassMap = @{
    "1"   = "GameObject"
    "4"   = "Transform"
    "20"  = "Camera"
    "23"  = "MeshRenderer"
    "25"  = "Renderer"
    "33"  = "MeshFilter"
    "54"  = "Rigidbody2D"
    "61"  = "BoxCollider2D"
    "65"  = "BoxCollider"
    "81"  = "AudioListener"
    "82"  = "AudioSource"
    "108" = "Light"
    "114" = "MonoBehaviour"
    "120" = "LineRenderer"
    "136" = "SkinnedMeshRenderer"
    "198" = "ParticleSystem"
    "199" = "ParticleSystemRenderer"
    "212" = "SpriteRenderer"
    "220" = "LightProbeGroup"
    "222" = "CanvasRenderer"
    "223" = "Canvas"
    "224" = "RectTransform"
    "225" = "Animator"
    "227" = "TextMesh"
    "281" = "EventSystem"
    "59"  = "Collider"
    "143" = "ReflectionProbe"
}

# ── Parse the scene file ──────────────────────────────────────────────────────
$lines = Get-Content $ScenePath -Encoding UTF8

# Pass 1 – collect all objects keyed by fileID
# Each object: {Type, ClassID, FileID, Name, Father, MonoClass, Components=[]}
$objects  = @{}   # fileID -> object dict
$current  = $null
$curFileID = ""

$goSectionPattern    = '^--- !u!(\d+) &(\d+)'
$nameLine            = '^\s+m_Name:\s*(.*)$'
$fatherLine          = '^\s+m_Father:\s*\{fileID:\s*(\d+)\}'
$editorClassLine     = '^\s+m_EditorClassIdentifier:\s*(.+)$'
$componentLine       = '^\s+-\s*component:\s*\{fileID:\s*(\d+)\}'
$gameObjectLine      = '^\s+m_GameObject:\s*\{fileID:\s*(\d+)\}'

foreach ($line in $lines) {
    if ($line -match $goSectionPattern) {
        $classID = $matches[1]
        $fileID  = $matches[2]
        $typeName = if ($ClassMap.ContainsKey($classID)) { $ClassMap[$classID] } else { "UnknownType($classID)" }

        $current = @{
            ClassID     = $classID
            FileID      = $fileID
            Type        = $typeName
            Name        = ""
            Father      = "0"
            MonoClass   = ""
            OwnerGO     = ""
            Components  = [System.Collections.Generic.List[string]]::new()
        }
        $objects[$fileID] = $current
        $curFileID = $fileID
        continue
    }

    if ($current -eq $null) { continue }

    if ($line -match $nameLine)        { $current.Name      = $matches[1].Trim() }
    if ($line -match $fatherLine)      { $current.Father    = $matches[1] }
    if ($line -match $editorClassLine) { $current.MonoClass = $matches[1].Trim() }
    if ($line -match $gameObjectLine)  { $current.OwnerGO   = $matches[1] }
    if ($line -match $componentLine)   { $current.Components.Add($matches[1]) }
}

# Pass 2 – for each component fileID attached to a GO, look up its type
# Build a GO map: GO fileID -> {Name, Father, [ComponentLabel]}
$goObjects = @{}
foreach ($kv in $objects.GetEnumerator()) {
    if ($kv.Value.ClassID -eq "1") {   # ClassID 1 = GameObject
        $go = $kv.Value
        $goObjects[$go.FileID] = @{
            Name       = $go.Name
            Father     = "0"
            CompLabels = [System.Collections.Generic.List[string]]::new()
        }
    }
}

# Resolve Transform.m_Father to find real parent GO
foreach ($kv in $objects.GetEnumerator()) {
    $obj = $kv.Value
    if ($obj.ClassID -eq "4" -or $obj.ClassID -eq "224") {  # Transform or RectTransform
        $ownerGO = $obj.OwnerGO
        $fatherXform = $obj.Father   # fileID of parent transform
        if ($goObjects.ContainsKey($ownerGO)) {
            # Find the GO that owns the parent transform
            if ($fatherXform -ne "0" -and $objects.ContainsKey($fatherXform)) {
                $parentGOid = $objects[$fatherXform].OwnerGO
                $goObjects[$ownerGO].Father = $parentGOid
            }
        }
    }
}

# Resolve components for each GO
foreach ($kv in $goObjects.GetEnumerator()) {
    $goID = $kv.Key
    $go   = $kv.Value
    if (-not $objects.ContainsKey($goID)) { continue }
    $goObj = $objects[$goID]
    foreach ($compID in $goObj.Components) {
        if (-not $objects.ContainsKey($compID)) { continue }
        $comp = $objects[$compID]
        if ($comp.ClassID -eq "1") { continue }   # skip self-reference
        if ($comp.ClassID -eq "4" -or $comp.ClassID -eq "224") { continue }  # skip Transform

        if ($comp.ClassID -eq "114" -and $comp.MonoClass -ne "") {
            # MonoBehaviour — use identifier
            $label = "MonoBehaviour: $($comp.MonoClass)"
        } else {
            $label = $comp.Type
        }
        $go.CompLabels.Add($label)
    }
}

# Pass 3 – identify root GOs (Father == "0")
$roots = @()
foreach ($kv in $goObjects.GetEnumerator()) {
    if ($kv.Value.Father -eq "0") {
        $roots += $kv
    }
}
$roots = $roots | Sort-Object { $_.Value.Name }

# ── Output ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  SCENE: experiment.unity" -ForegroundColor Cyan
Write-Host "  Root GameObjects: $($roots.Count)   Total GOs: $($goObjects.Count)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

function Print-GOTree($goID, $depth) {
    if (-not $goObjects.ContainsKey($goID)) { return }
    $go = $goObjects[$goID]
    $indent = "  " * $depth
    $marker = if ($depth -eq 0) { "▶" } else { "└─" }
    Write-Host "${indent}${marker} $($go.Name)" -ForegroundColor Yellow

    foreach ($lbl in $go.CompLabels) {
        Write-Host "${indent}      • $lbl" -ForegroundColor White
    }

    # Print children
    $children = $goObjects.GetEnumerator() | Where-Object { $_.Value.Father -eq $goID } | Sort-Object { $_.Value.Name }
    foreach ($child in $children) {
        Print-GOTree $child.Key ($depth + 1)
    }
}

foreach ($root in $roots) {
    Print-GOTree $root.Key 0
    Write-Host ""
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Done." -ForegroundColor Green
