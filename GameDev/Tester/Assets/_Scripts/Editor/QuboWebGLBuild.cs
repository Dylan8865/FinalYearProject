using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

public static class QuboWebGLBuild
{
    /// <summary>Builds the WebGL game directly into Qubo's Vite public folder.</summary>
    public static void Build()
    {
        string outputPath = Environment.GetEnvironmentVariable("QUBO_WEBGL_BUILD_PATH");
        if (string.IsNullOrWhiteSpace(outputPath))
        {
            outputPath = Path.GetFullPath(Path.Combine(Application.dataPath, "..", "..", "..", "qubo", "frontend", "public", "game"));
        }

        Directory.CreateDirectory(outputPath);
        BuildReport report = BuildPipeline.BuildPlayer(
            EditorBuildSettings.scenes,
            outputPath,
            BuildTarget.WebGL,
            BuildOptions.None);

        if (report.summary.result != BuildResult.Succeeded)
        {
            throw new Exception($"WebGL build failed: {report.summary.result}");
        }
    }
}
