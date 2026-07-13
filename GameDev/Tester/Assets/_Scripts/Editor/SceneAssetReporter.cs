// SceneAssetReporter.cs
// Editor-only utility — placed inside an Editor/ folder so it is never included in builds.
// Usage: Tools > Scene Asset Reporter > Print Asset Report   (shortcut: Ctrl+Alt+R)

using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEngine;
using UnityEngine.SceneManagement;

/// <summary>
/// Prints a structured report to the Unity Console that lists every
/// GameObject in the active scene together with the names of its main
/// attached assets (Meshes, Materials, Sprites).
///
/// HOW TO USE
/// ----------
/// 1. Open any scene in the Unity Editor.
/// 2. From the top menu bar choose:
///       Tools  ▸  Scene Asset Reporter  ▸  Print Asset Report
///    — or press Ctrl + Alt + R (Windows) / Cmd + Option + R (macOS).
/// 3. Open the Console window (Window ▸ General ▸ Console).
/// 4. The report appears as a single, expandable log entry.
///    Click it to see all GameObject / asset pairs.
///
/// NOTES
/// -----
/// • Inactive GameObjects ARE included so nothing is silently skipped.
/// • Objects with no relevant asset components are omitted from the report.
/// • The script carries zero runtime overhead — it is Editor-only.
/// </summary>
public static class SceneAssetReporter
{
    private const string MenuPath = "Tools/Scene Asset Reporter/Print Asset Report";

    // -------------------------------------------------------------------------
    // Menu entry
    // -------------------------------------------------------------------------

    [MenuItem(MenuPath, priority = 1)]
    public static void PrintAssetReport()
    {
        Scene activeScene = SceneManager.GetActiveScene();

        if (!activeScene.IsValid())
        {
            Debug.LogWarning("[SceneAssetReporter] No valid active scene found. Please open a scene first.");
            return;
        }

        List<ReportEntry> entries = CollectEntries(activeScene);
        string report = BuildReport(activeScene.name, entries);

        Debug.Log(report);
    }

    // -------------------------------------------------------------------------
    // Data collection
    // -------------------------------------------------------------------------

    private static List<ReportEntry> CollectEntries(Scene scene)
    {
        var entries = new List<ReportEntry>();

        // Walk every root object and all of its descendants.
        foreach (GameObject root in scene.GetRootGameObjects())
        {
            CollectFromTransform(root.transform, entries);
        }

        return entries;
    }

    private static void CollectFromTransform(Transform t, List<ReportEntry> results)
    {
        GameObject go = t.gameObject;

        var entry = new ReportEntry(go.name, go.activeInHierarchy);

        // ── MeshFilter → Mesh ────────────────────────────────────────────────
        var meshFilter = go.GetComponent<MeshFilter>();
        if (meshFilter != null && meshFilter.sharedMesh != null)
        {
            entry.MeshName = meshFilter.sharedMesh.name;
        }

        // ── MeshRenderer → Materials ─────────────────────────────────────────
        var meshRenderer = go.GetComponent<MeshRenderer>();
        if (meshRenderer != null)
        {
            entry.Materials.AddRange(GetMaterialNames(meshRenderer.sharedMaterials));
        }

        // ── SkinnedMeshRenderer → Mesh + Materials ───────────────────────────
        var skinnedRenderer = go.GetComponent<SkinnedMeshRenderer>();
        if (skinnedRenderer != null)
        {
            if (skinnedRenderer.sharedMesh != null && string.IsNullOrEmpty(entry.MeshName))
            {
                entry.MeshName = skinnedRenderer.sharedMesh.name;
            }
            entry.Materials.AddRange(GetMaterialNames(skinnedRenderer.sharedMaterials));
        }

        // ── SpriteRenderer → Sprite + Material ──────────────────────────────
        var spriteRenderer = go.GetComponent<SpriteRenderer>();
        if (spriteRenderer != null)
        {
            if (spriteRenderer.sprite != null)
            {
                entry.SpriteName = spriteRenderer.sprite.name;
            }
            if (spriteRenderer.sharedMaterial != null)
            {
                string matName = spriteRenderer.sharedMaterial.name;
                if (!entry.Materials.Contains(matName))
                    entry.Materials.Add(matName);
            }
        }

        // Only record objects that have at least one relevant asset.
        if (entry.HasAssets)
        {
            results.Add(entry);
        }

        // Recurse into children.
        foreach (Transform child in t)
        {
            CollectFromTransform(child, results);
        }
    }

    // -------------------------------------------------------------------------
    // Report formatting
    // -------------------------------------------------------------------------

    private static string BuildReport(string sceneName, List<ReportEntry> entries)
    {
        var sb = new StringBuilder();
        const string separator = "══════════════════════════════════════════";

        sb.AppendLine(separator);
        sb.AppendLine("  SCENE ASSET REPORT");
        sb.AppendLine(separator);
        sb.AppendLine($"  Scene   : {sceneName}");
        sb.AppendLine($"  Objects with assets reported: {entries.Count}");
        sb.AppendLine(separator);
        sb.AppendLine();

        if (entries.Count == 0)
        {
            sb.AppendLine("  (No GameObjects with Mesh / Material / Sprite assets found.)");
        }
        else
        {
            foreach (var entry in entries)
            {
                string activeTag = entry.IsActive ? "" : " [INACTIVE]";
                sb.AppendLine($"▶ {entry.GameObjectName}{activeTag}");

                if (!string.IsNullOrEmpty(entry.MeshName))
                    sb.AppendLine($"    Mesh      : {entry.MeshName}");

                if (entry.Materials.Count > 0)
                    sb.AppendLine($"    Materials : {string.Join(", ", entry.Materials)}");

                if (!string.IsNullOrEmpty(entry.SpriteName))
                    sb.AppendLine($"    Sprite    : {entry.SpriteName}");

                sb.AppendLine();
            }
        }

        sb.AppendLine(separator);
        sb.Append("  Report complete.");

        return sb.ToString();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static IEnumerable<string> GetMaterialNames(Material[] materials)
    {
        if (materials == null) yield break;
        foreach (var mat in materials)
        {
            if (mat != null)
                yield return mat.name;
        }
    }

    // -------------------------------------------------------------------------
    // Internal data structure
    // -------------------------------------------------------------------------

    private sealed class ReportEntry
    {
        public readonly string GameObjectName;
        public readonly bool   IsActive;
        public string          MeshName   = string.Empty;
        public string          SpriteName = string.Empty;
        public readonly List<string> Materials = new List<string>();

        public bool HasAssets =>
            !string.IsNullOrEmpty(MeshName) ||
            !string.IsNullOrEmpty(SpriteName) ||
            Materials.Count > 0;

        public ReportEntry(string name, bool isActive)
        {
            GameObjectName = name;
            IsActive       = isActive;
        }
    }
}
