using System;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace BatchTools
{
    public static class UIBatchRunner
    {
        private const string ScenePath = "Assets/_Recovery/experiment.unity";
        private const string ScreenshotPath = "Screenshots/ui_shot_1.png";
        private const int ScreenshotWidth = 1280;
        private const int ScreenshotHeight = 720;

        public static void RunAll()
        {
            try
            {
                Directory.CreateDirectory("Screenshots");
                EditorSceneManager.OpenScene(ScenePath);

                EnsureStartUiVisible();
                CaptureScreenshot();
                Debug.Log($"UI batch screenshot saved: {ScreenshotPath}");
            }
            catch (Exception ex)
            {
                Debug.LogError($"UI batch runner failed: {ex}");
                EditorApplication.Exit(1);
            }
        }

        private static void EnsureStartUiVisible()
        {
            GameObject canvas = GameObject.Find("Canvas");
            if (canvas == null)
            {
                throw new InvalidOperationException("Canvas not found in experiment scene.");
            }

            GameObject loginPrefab = Resources.Load<GameObject>("UI/LoginUI");
            if (loginPrefab == null)
            {
                throw new InvalidOperationException("Resources/UI/LoginUI.prefab could not be loaded.");
            }

            GameObject loginUi = UnityEngine.Object.Instantiate(loginPrefab, canvas.transform);
            loginUi.name = "LoginUI";

            Camera camera = Camera.main;
            if (camera == null)
            {
                GameObject cameraObject = new GameObject("UIBatchCamera");
                camera = cameraObject.AddComponent<Camera>();
                camera.transform.position = new Vector3(0f, 0f, -10f);
                camera.clearFlags = CameraClearFlags.SolidColor;
                camera.backgroundColor = Color.black;
            }

            Canvas canvasComponent = canvas.GetComponent<Canvas>();
            if (canvasComponent != null)
            {
                canvasComponent.renderMode = RenderMode.ScreenSpaceCamera;
                canvasComponent.worldCamera = camera;
                canvasComponent.planeDistance = 1f;
            }
        }

        private static void CaptureScreenshot()
        {
            Camera camera = Camera.main ?? UnityEngine.Object.FindFirstObjectByType<Camera>();
            if (camera == null)
            {
                throw new InvalidOperationException("No camera found for UI batch screenshot.");
            }

            RenderTexture renderTexture = new RenderTexture(ScreenshotWidth, ScreenshotHeight, 24);
            Texture2D screenshot = new Texture2D(ScreenshotWidth, ScreenshotHeight, TextureFormat.RGB24, false);
            RenderTexture previousActive = RenderTexture.active;
            RenderTexture previousTarget = camera.targetTexture;

            try
            {
                camera.targetTexture = renderTexture;
                RenderTexture.active = renderTexture;
                camera.Render();
                screenshot.ReadPixels(new Rect(0, 0, ScreenshotWidth, ScreenshotHeight), 0, 0);
                screenshot.Apply();
                File.WriteAllBytes(ScreenshotPath, screenshot.EncodeToPNG());
            }
            finally
            {
                camera.targetTexture = previousTarget;
                RenderTexture.active = previousActive;
                UnityEngine.Object.DestroyImmediate(screenshot);
                UnityEngine.Object.DestroyImmediate(renderTexture);
            }
        }
    }
}
