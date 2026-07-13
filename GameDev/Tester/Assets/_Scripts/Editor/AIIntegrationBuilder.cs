using System;
using System.IO;
using UnityEditor;
using UnityEditor.Events;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;

namespace BatchTools
{
    public static class AIIntegrationBuilder
    {
        private const string LoginPrefabPath = "Assets/Resources/UI/LoginUI.prefab";
        private const string GameOverPrefabPath = "Assets/Resources/UI/GameOverUI.prefab";
        private const string ScenePath = "Assets/_Recovery/experiment.unity";

        [MenuItem("Tools/AI Integration/Build UI Prefabs")]
        public static void Build()
        {
            ConfigureLoginPrefab();
            CreateGameOverPrefab();
            FixActiveScene();
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("AI integration UI build complete.");
        }

        private static void ConfigureLoginPrefab()
        {
            GameObject root = PrefabUtility.LoadPrefabContents(LoginPrefabPath);
            try
            {
                LoginUI login = root.GetComponent<LoginUI>();
                if (login == null)
                {
                    login = root.AddComponent<LoginUI>();
                }

                RectTransform rootRect = root.GetComponent<RectTransform>();
                if (rootRect != null)
                {
                    Stretch(rootRect);
                }

                Font buttonFont = LoadFont("Assets/Font/_TitleButton.ttf") ?? LoadFont("Assets/Font/cuyuan.ttf");
                Sprite buttonSprite = LoadSprite("Assets/Arts/gui2/UI/Elements/Button.png") ?? LoadSprite("Assets/Arts/gui/UI/Button.png");

                Button startButton = FindChild<Button>(root, "startBtn");
                if (startButton != null)
                {
                    Text text = FindButtonText(startButton);
                    if (text != null)
                    {
                        text.text = "Start Game";
                        if (buttonFont != null)
                        {
                            text.font = buttonFont;
                        }
                    }

                    BindButton(startButton, login, "OnStartGameClicked");
                }

                Button quitButton = FindChild<Button>(root, "quitBtn");
                if (quitButton != null)
                {
                    Text text = FindButtonText(quitButton);
                    if (text != null)
                    {
                        text.text = "Quit";
                        if (buttonFont != null)
                        {
                            text.font = buttonFont;
                        }
                    }

                    BindButton(quitButton, login, "OnQuitClicked");
                }

                Button muteButton = FindChild<Button>(root, "MuteBGM_Button");
                if (muteButton == null)
                {
                    GameObject bg = FindChildObject(root, "bg") ?? root;
                    muteButton = CreateButton("MuteBGM_Button", bg.transform, buttonSprite, buttonFont, "Mute BGM", new Vector2(1f, 1f), new Vector2(-190f, -90f), new Vector2(260f, 74f));
                }
                else
                {
                    Text text = FindButtonText(muteButton);
                    if (text != null)
                    {
                        text.text = "Mute BGM";
                    }
                }

                BindButton(muteButton, login, "OnMuteClicked");
                PrefabUtility.SaveAsPrefabAsset(root, LoginPrefabPath);
            }
            finally
            {
                PrefabUtility.UnloadPrefabContents(root);
            }
        }

        private static void CreateGameOverPrefab()
        {
            Font titleFont = LoadFont("Assets/Font/_TitleButton.ttf") ?? LoadFont("Assets/Font/_Content.ttf");
            Font buttonFont = LoadFont("Assets/Font/_Content.ttf") ?? titleFont;
            Sprite boardSprite = LoadSprite("Assets/Arts/gui/UI/EndBattlePopup.png") ?? LoadSprite("Assets/Arts/gui/UI/EndBattleElement.png");
            Sprite buttonSprite = LoadSprite("Assets/Arts/gui/UI/Button.png") ?? LoadSprite("Assets/Arts/gui2/UI/Elements/Button.png");

            GameObject root = new GameObject("GameOverUI", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image), typeof(GameOverUI));
            root.layer = 5;
            Stretch(root.GetComponent<RectTransform>());

            Image dim = root.GetComponent<Image>();
            dim.color = new Color(0f, 0f, 0f, 0.55f);

            GameObject board = new GameObject("GameOverBoard", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image));
            board.layer = 5;
            board.transform.SetParent(root.transform, false);
            SetRect(board.GetComponent<RectTransform>(), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(880f, 560f));

            Image boardImage = board.GetComponent<Image>();
            boardImage.sprite = boardSprite;
            boardImage.type = Image.Type.Sliced;
            boardImage.color = Color.white;

            GameObject titleGo = new GameObject("Title", typeof(RectTransform), typeof(CanvasRenderer), typeof(Text));
            titleGo.layer = 5;
            titleGo.transform.SetParent(board.transform, false);
            SetRect(titleGo.GetComponent<RectTransform>(), new Vector2(0.5f, 0.5f), new Vector2(0f, 128f), new Vector2(700f, 140f));

            Text title = titleGo.GetComponent<Text>();
            title.text = "GAME OVER";
            title.font = titleFont != null ? titleFont : Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            title.fontSize = 82;
            title.fontStyle = FontStyle.Bold;
            title.alignment = TextAnchor.MiddleCenter;
            title.color = new Color(0.86f, 0.08f, 0.06f, 1f);

            Button retryButton = CreateButton("retryBtn", board.transform, buttonSprite, buttonFont, "Retry", new Vector2(0.5f, 0.5f), new Vector2(0f, -86f), new Vector2(360f, 96f));
            Button mainMenuButton = CreateButton("MainMenuButton", board.transform, buttonSprite, buttonFont, "Main Menu", new Vector2(0.5f, 0.5f), new Vector2(0f, -206f), new Vector2(360f, 76f));

            GameOverUI controller = root.GetComponent<GameOverUI>();
            BindButton(retryButton, controller, "OnRetryClicked");
            BindButton(mainMenuButton, controller, "OnMainMenuClicked");

            Directory.CreateDirectory("Assets/Resources/UI");
            PrefabUtility.SaveAsPrefabAsset(root, GameOverPrefabPath);
            UnityEngine.Object.DestroyImmediate(root);
        }

        private static void FixActiveScene()
        {
            var scene = EditorSceneManager.OpenScene(ScenePath);
            Canvas mainCanvas = FindMainCanvas();

            if (mainCanvas == null)
            {
                GameObject uiRoot = GameObject.Find("--- UI ---");
                GameObject canvasObject = new GameObject("Canvas", typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
                if (uiRoot != null)
                {
                    canvasObject.transform.SetParent(uiRoot.transform, false);
                }

                mainCanvas = canvasObject.GetComponent<Canvas>();
            }

            mainCanvas.renderMode = RenderMode.ScreenSpaceOverlay;

            CanvasScaler scaler = mainCanvas.GetComponent<CanvasScaler>();
            if (scaler == null)
            {
                scaler = mainCanvas.gameObject.AddComponent<CanvasScaler>();
            }

            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(2560f, 1440f);

            if (mainCanvas.GetComponent<GraphicRaycaster>() == null)
            {
                mainCanvas.gameObject.AddComponent<GraphicRaycaster>();
            }

            UIManager manager = mainCanvas.GetComponentInChildren<UIManager>(true);
            if (manager == null)
            {
                GameObject managerObject = new GameObject("UIManager", typeof(RectTransform), typeof(UIManager));
                managerObject.layer = 5;
                managerObject.transform.SetParent(mainCanvas.transform, false);
                Stretch(managerObject.GetComponent<RectTransform>());
            }

            GameObject loginObject = FindSceneLoginUI();
            if (loginObject == null)
            {
                GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(LoginPrefabPath);
                loginObject = PrefabUtility.InstantiatePrefab(prefab, mainCanvas.transform) as GameObject;
                if (loginObject != null)
                {
                    loginObject.name = "LoginUI";
                }
            }
            else
            {
                loginObject.transform.SetParent(mainCanvas.transform, false);
            }

            if (loginObject != null)
            {
                loginObject.SetActive(true);
                RectTransform loginRect = loginObject.GetComponent<RectTransform>();
                if (loginRect != null)
                {
                    Stretch(loginRect);
                }
            }

            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene);
        }

        private static Canvas FindMainCanvas()
        {
            Canvas[] canvases = UnityEngine.Object.FindObjectsOfType<Canvas>(true);
            for (int i = 0; i < canvases.Length; i++)
            {
                if (canvases[i].transform.parent != null && canvases[i].transform.parent.name == "--- UI ---")
                {
                    return canvases[i];
                }
            }

            return null;
        }

        private static GameObject FindSceneLoginUI()
        {
            LoginUI[] logins = UnityEngine.Object.FindObjectsOfType<LoginUI>(true);
            return logins.Length > 0 ? logins[0].gameObject : null;
        }

        private static Sprite LoadSprite(string path)
        {
            return AssetDatabase.LoadAssetAtPath<Sprite>(path);
        }

        private static Font LoadFont(string path)
        {
            return AssetDatabase.LoadAssetAtPath<Font>(path);
        }

        private static T FindChild<T>(GameObject root, string name) where T : Component
        {
            Transform[] children = root.GetComponentsInChildren<Transform>(true);
            for (int i = 0; i < children.Length; i++)
            {
                if (children[i].name == name)
                {
                    return children[i].GetComponent<T>();
                }
            }

            return null;
        }

        private static GameObject FindChildObject(GameObject root, string name)
        {
            Transform[] children = root.GetComponentsInChildren<Transform>(true);
            for (int i = 0; i < children.Length; i++)
            {
                if (children[i].name == name)
                {
                    return children[i].gameObject;
                }
            }

            return null;
        }

        private static Text FindButtonText(Button button)
        {
            return button == null ? null : button.GetComponentInChildren<Text>(true);
        }

        private static void Stretch(RectTransform rect)
        {
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;
            rect.localScale = Vector3.one;
        }

        private static void SetRect(RectTransform rect, Vector2 anchor, Vector2 position, Vector2 size)
        {
            rect.anchorMin = anchor;
            rect.anchorMax = anchor;
            rect.pivot = new Vector2(0.5f, 0.5f);
            rect.anchoredPosition = position;
            rect.sizeDelta = size;
            rect.localScale = Vector3.one;
        }

        private static Button CreateButton(string name, Transform parent, Sprite sprite, Font font, string label, Vector2 anchor, Vector2 position, Vector2 size)
        {
            GameObject buttonObject = new GameObject(name, typeof(RectTransform), typeof(CanvasRenderer), typeof(Image), typeof(Button));
            buttonObject.layer = 5;
            buttonObject.transform.SetParent(parent, false);

            RectTransform rect = buttonObject.GetComponent<RectTransform>();
            SetRect(rect, anchor, position, size);

            Image image = buttonObject.GetComponent<Image>();
            image.sprite = sprite;
            image.type = Image.Type.Sliced;

            Button button = buttonObject.GetComponent<Button>();
            button.targetGraphic = image;

            GameObject textObject = new GameObject("Text", typeof(RectTransform), typeof(CanvasRenderer), typeof(Text));
            textObject.layer = 5;
            textObject.transform.SetParent(buttonObject.transform, false);
            Stretch(textObject.GetComponent<RectTransform>());

            Text text = textObject.GetComponent<Text>();
            text.text = label;
            text.font = font != null ? font : Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            text.fontSize = 40;
            text.fontStyle = FontStyle.Bold;
            text.alignment = TextAnchor.MiddleCenter;
            text.color = Color.white;

            return button;
        }

        private static void BindButton(Button button, UnityEngine.Object target, string methodName)
        {
            if (button == null || target == null)
            {
                return;
            }

            button.onClick.RemoveAllListeners();
            Delegate action = Delegate.CreateDelegate(typeof(UnityAction), target, methodName);
            UnityEventTools.AddPersistentListener(button.onClick, action as UnityAction);
            EditorUtility.SetDirty(button);
        }
    }
}
