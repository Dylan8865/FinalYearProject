using System.Collections.Generic;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.UI;

namespace BatchTools
{
    public static class InGameUIBuilder
    {
        private const string PrefabPath = "Assets/Resources/UI/InGameUI.prefab";
        private const string ScenePath = "Assets/_Recovery/experiment.unity";

        private static Font titleFont;
        private static Font bodyFont;
        private static Sprite buttonSprite;

        [MenuItem("Tools/AI Integration/Build In-Game UI")]
        public static void Build()
        {
            titleFont = AssetDatabase.LoadAssetAtPath<Font>("Assets/Font/_TitleButton.ttf");
            bodyFont = AssetDatabase.LoadAssetAtPath<Font>("Assets/Font/_Content.ttf") ?? titleFont;
            buttonSprite = AssetDatabase.LoadAssetAtPath<Sprite>("Assets/Arts/gui/UI/Button.png");

            GameObject root = CreateObject("InGameUI", null);
            InGameUI controller = root.AddComponent<InGameUI>();
            root.AddComponent<RunProgressionSystem>();
            Stretch(root.GetComponent<RectTransform>());

            GameObject hudRoot = CreateObject("HUDRoot", root.transform);
            Stretch(hudRoot.GetComponent<RectTransform>());

            Sprite hudSprite = LoadSprite("Assets/Resources/UI/InGame/hud-menu.png");
            Sprite deckSprite = LoadSprite("Assets/Arts/gui/UI/Deck.png");
            Button pauseButton = CreateIconButton("PauseButton", hudRoot.transform, hudSprite,
                new Vector2(0f, 1f), new Vector2(80f, -78f), new Vector2(108f, 108f));
            Button recipeButton = CreateIconButton("RecipeButton", hudRoot.transform, deckSprite,
                new Vector2(1f, 1f), new Vector2(-82f, -210f), new Vector2(112f, 128f));

            GameObject progressHud = CreateObject("ProgressHUD", hudRoot.transform);
            SetRect(progressHud.GetComponent<RectTransform>(), new Vector2(0.5f, 1f), new Vector2(0f, -66f), new Vector2(920f, 92f));
            Image progressBackground = progressHud.AddComponent<Image>();
            progressBackground.color = new Color(0.035f, 0.07f, 0.085f, 0.88f);
            Text scoreText = CreateText("ScoreText", progressHud.transform, "SCORE  0", 34, new Vector2(-280f, 0f), new Vector2(300f, 70f), Color.white);
            Text waveText = CreateText("WaveText", progressHud.transform, "WAVE  1 / 6", 34, Vector2.zero, new Vector2(300f, 70f), Color.white);
            Text comboText = CreateText("ComboText", progressHud.transform, string.Empty, 34, new Vector2(280f, 0f), new Vector2(300f, 70f), new Color(0.98f, 0.72f, 0.18f, 1f));

            GameObject pausePanel = CreateOverlay("PausePanel", root.transform);
            GameObject pauseBoard = CreateBoard("PauseBoard", pausePanel.transform, new Vector2(650f, 930f), new Color(0.30f, 0.13f, 0.055f, 1f));
            AddWoodBands(pauseBoard.transform, 7, new Vector2(600f, 92f));
            CreateText("Title", pauseBoard.transform, "PAUSED", 68, new Vector2(0f, 340f), new Vector2(520f, 110f), Color.white);
            Button playButton = CreateButton("PlayButton", pauseBoard.transform, "PLAY", new Vector2(0f, 190f), new Vector2(420f, 96f));
            Button restartButton = CreateButton("RestartButton", pauseBoard.transform, "RESTART", new Vector2(0f, 68f), new Vector2(420f, 96f));
            Button optionsButton = CreateButton("OptionsButton", pauseBoard.transform, "OPTIONS", new Vector2(0f, -54f), new Vector2(420f, 96f));
            Button quitButton = CreateButton("QuitButton", pauseBoard.transform, "QUIT", new Vector2(0f, -176f), new Vector2(420f, 96f));

            GameObject optionsPanel = CreateOverlay("OptionsPanel", root.transform);
            GameObject optionsBoard = CreateBoard("OptionsBoard", optionsPanel.transform, new Vector2(800f, 720f), new Color(0.30f, 0.13f, 0.055f, 1f));
            AddWoodBands(optionsBoard.transform, 5, new Vector2(740f, 98f));
            CreateText("Title", optionsBoard.transform, "OPTIONS", 64, new Vector2(0f, 262f), new Vector2(620f, 100f), Color.white);

            Sprite musicOn = LoadSprite("Assets/Resources/UI/InGame/music-on.png");
            Sprite musicOff = LoadSprite("Assets/Resources/UI/InGame/music-off.png");
            Sprite soundOn = LoadSprite("Assets/Resources/UI/InGame/sound-on.png");
            Sprite soundOff = LoadSprite("Assets/Resources/UI/InGame/sound-off.png");

            Text musicLabel = CreateText("MusicLabel", optionsBoard.transform, "MUSIC", 38, new Vector2(-205f, 110f), new Vector2(230f, 70f), Color.white);
            musicLabel.alignment = TextAnchor.MiddleLeft;
            Button musicMuteButton = CreateIconButton("MusicMuteButton", optionsBoard.transform, musicOn,
                new Vector2(0.5f, 0.5f), new Vector2(265f, 110f), new Vector2(92f, 92f));
            Slider musicSlider = CreateSlider("MusicSlider", optionsBoard.transform, new Vector2(35f, 110f));

            Text soundLabel = CreateText("SoundLabel", optionsBoard.transform, "SOUND", 38, new Vector2(-205f, -36f), new Vector2(230f, 70f), Color.white);
            soundLabel.alignment = TextAnchor.MiddleLeft;
            Button soundMuteButton = CreateIconButton("SoundMuteButton", optionsBoard.transform, soundOn,
                new Vector2(0.5f, 0.5f), new Vector2(265f, -36f), new Vector2(92f, 92f));
            Slider soundSlider = CreateSlider("SoundSlider", optionsBoard.transform, new Vector2(35f, -36f));
            Button optionsCloseButton = CreateButton("OptionsCloseButton", optionsBoard.transform, "X", new Vector2(0f, -258f), new Vector2(100f, 86f));

            GameObject recipePanel = CreateOverlay("RecipePanel", root.transform);
            Sprite largeBoardSprite = LoadSprite("Assets/Arts/gui/UI/EndBattlePopup.png");
            GameObject recipeBoard = CreateBoard("RecipeBoard", recipePanel.transform, new Vector2(1560f, 1120f), new Color(0.10f, 0.16f, 0.18f, 1f));
            recipeBoard.GetComponent<Image>().sprite = largeBoardSprite;
            recipeBoard.GetComponent<Image>().type = Image.Type.Sliced;
            CreateText("Title", recipeBoard.transform, "COMPOUND RECIPE BOOK", 62, new Vector2(0f, 448f), new Vector2(1100f, 100f), Color.white);
            Button recipeCloseButton = CreateButton("RecipeCloseButton", recipeBoard.transform, "X", new Vector2(655f, 455f), new Vector2(96f, 82f));
            Button tutorialButton = CreateButton("TutorialButton", recipeBoard.transform, "HELP", new Vector2(-610f, 455f), new Vector2(190f, 78f));

            RectTransform recipeContent;
            GameObject recipeRowTemplate;
            CreateRecipeScroll(recipeBoard.transform, out recipeContent, out recipeRowTemplate);

            GameObject tutorialPanel = CreateOverlay("TutorialPanel", root.transform);
            GameObject tutorialBoard = CreateBoard("TutorialBoard", tutorialPanel.transform, new Vector2(1540f, 820f), new Color(0.17f, 0.22f, 0.25f, 1f));
            Text tutorialTitle = CreateText("TutorialTitle", tutorialBoard.transform, "PLAY A CARD", 64, new Vector2(0f, 265f), new Vector2(1100f, 100f), Color.white);
            Text tutorialBody = CreateText("TutorialBody", tutorialBoard.transform, string.Empty, 38, new Vector2(0f, 40f), new Vector2(1120f, 300f), new Color(0.94f, 0.95f, 0.92f, 1f));
            tutorialBody.alignment = TextAnchor.MiddleCenter;
            tutorialBody.horizontalOverflow = HorizontalWrapMode.Wrap;
            tutorialBody.verticalOverflow = VerticalWrapMode.Overflow;
            Button previousButton = CreateButton("TutorialPreviousButton", tutorialBoard.transform, "<", new Vector2(-570f, -270f), new Vector2(110f, 86f));
            Button nextButton = CreateButton("TutorialNextButton", tutorialBoard.transform, ">", new Vector2(570f, -270f), new Vector2(110f, 86f));
            Button tutorialCloseButton = CreateButton("TutorialCloseButton", tutorialBoard.transform, "X", new Vector2(650f, 285f), new Vector2(92f, 80f));
            List<Image> dots = CreateDots(tutorialBoard.transform, 4);

            GameObject waveRewardPanel = CreateOverlay("WaveRewardPanel", root.transform);
            GameObject rewardBoard = CreateBoard("WaveRewardBoard", waveRewardPanel.transform, new Vector2(1180f, 760f), new Color(0.13f, 0.20f, 0.22f, 1f));
            CreateText("RewardTitle", rewardBoard.transform, "WAVE CLEARED", 68, new Vector2(0f, 245f), new Vector2(900f, 100f), Color.white);
            Text waveRewardSubtitle = CreateText("WaveRewardSubtitle", rewardBoard.transform, "CHOOSE ONE UPGRADE", 36, new Vector2(0f, 145f), new Vector2(900f, 100f), new Color(0.98f, 0.72f, 0.18f, 1f));
            Button healRewardButton = CreateButton("HealRewardButton", rewardBoard.transform, "RESTORE 20 HP", new Vector2(-365f, -65f), new Vector2(310f, 150f));
            Button maxHealthRewardButton = CreateButton("MaxHealthRewardButton", rewardBoard.transform, "MAX HP +15", new Vector2(0f, -65f), new Vector2(310f, 150f));
            Button attackRewardButton = CreateButton("AttackRewardButton", rewardBoard.transform, "DAMAGE +2", new Vector2(365f, -65f), new Vector2(310f, 150f));

            GameObject finalReportPanel = CreateOverlay("FinalReportPanel", root.transform);
            GameObject reportBoard = CreateBoard("FinalReportBoard", finalReportPanel.transform, new Vector2(1240f, 1080f), new Color(0.08f, 0.14f, 0.17f, 1f));
            Text finalReportText = CreateText("FinalReportText", reportBoard.transform, "EXPERIMENT COMPLETE", 38, new Vector2(0f, 70f), new Vector2(1000f, 760f), Color.white);
            finalReportText.alignment = TextAnchor.MiddleLeft;
            Button finalRestartButton = CreateButton("FinalRestartButton", reportBoard.transform, "RESTART", new Vector2(-235f, -430f), new Vector2(360f, 96f));
            Button finalMenuButton = CreateButton("FinalMenuButton", reportBoard.transform, "MAIN MENU", new Vector2(235f, -430f), new Vector2(360f, 96f));

            SerializedObject serialized = new SerializedObject(controller);
            Set(serialized, "hudRoot", hudRoot);
            Set(serialized, "pauseButton", pauseButton);
            Set(serialized, "recipeButton", recipeButton);
            Set(serialized, "scoreText", scoreText);
            Set(serialized, "waveText", waveText);
            Set(serialized, "comboText", comboText);
            Set(serialized, "pausePanel", pausePanel);
            Set(serialized, "playButton", playButton);
            Set(serialized, "restartButton", restartButton);
            Set(serialized, "optionsButton", optionsButton);
            Set(serialized, "quitButton", quitButton);
            Set(serialized, "optionsPanel", optionsPanel);
            Set(serialized, "musicSlider", musicSlider);
            Set(serialized, "soundSlider", soundSlider);
            Set(serialized, "musicMuteButton", musicMuteButton);
            Set(serialized, "soundMuteButton", soundMuteButton);
            Set(serialized, "musicMuteIcon", musicMuteButton.GetComponent<Image>());
            Set(serialized, "soundMuteIcon", soundMuteButton.GetComponent<Image>());
            Set(serialized, "musicOnSprite", musicOn);
            Set(serialized, "musicOffSprite", musicOff);
            Set(serialized, "soundOnSprite", soundOn);
            Set(serialized, "soundOffSprite", soundOff);
            Set(serialized, "optionsCloseButton", optionsCloseButton);
            Set(serialized, "recipePanel", recipePanel);
            Set(serialized, "recipeContent", recipeContent);
            Set(serialized, "recipeRowTemplate", recipeRowTemplate);
            Set(serialized, "recipeCloseButton", recipeCloseButton);
            Set(serialized, "tutorialButton", tutorialButton);
            Set(serialized, "tutorialPanel", tutorialPanel);
            Set(serialized, "tutorialTitle", tutorialTitle);
            Set(serialized, "tutorialBody", tutorialBody);
            Set(serialized, "tutorialPreviousButton", previousButton);
            Set(serialized, "tutorialNextButton", nextButton);
            Set(serialized, "tutorialCloseButton", tutorialCloseButton);
            Set(serialized, "waveRewardPanel", waveRewardPanel);
            Set(serialized, "waveRewardSubtitle", waveRewardSubtitle);
            Set(serialized, "healRewardButton", healRewardButton);
            Set(serialized, "maxHealthRewardButton", maxHealthRewardButton);
            Set(serialized, "attackRewardButton", attackRewardButton);
            Set(serialized, "finalReportPanel", finalReportPanel);
            Set(serialized, "finalReportText", finalReportText);
            Set(serialized, "finalRestartButton", finalRestartButton);
            Set(serialized, "finalMenuButton", finalMenuButton);
            SerializedProperty dotProperty = serialized.FindProperty("tutorialDots");
            dotProperty.arraySize = dots.Count;
            for (int i = 0; i < dots.Count; i++)
            {
                dotProperty.GetArrayElementAtIndex(i).objectReferenceValue = dots[i];
            }
            serialized.ApplyModifiedPropertiesWithoutUndo();

            pausePanel.SetActive(false);
            optionsPanel.SetActive(false);
            recipePanel.SetActive(false);
            tutorialPanel.SetActive(false);
            waveRewardPanel.SetActive(false);
            finalReportPanel.SetActive(false);

            PrefabUtility.SaveAsPrefabAsset(root, PrefabPath);
            Object.DestroyImmediate(root);
            ConfigureLoginAudioButtons();
            AddToScene();
            AssetDatabase.SaveAssets();
            Debug.Log("In-game UI prefab and scene instance built.");
        }

        private static void ConfigureLoginAudioButtons()
        {
            const string loginPath = "Assets/Resources/UI/LoginUI.prefab";
            GameObject loginRoot = PrefabUtility.LoadPrefabContents(loginPath);
            try
            {
                Button musicButton = FindButton(loginRoot, "MuteBGM_Button");
                if (musicButton == null) return;

                Image musicImage = musicButton.GetComponent<Image>();
                musicImage.sprite = LoadSprite("Assets/Resources/UI/InGame/music-on.png");
                musicImage.preserveAspect = true;
                RectTransform musicRect = musicButton.GetComponent<RectTransform>();
                musicRect.sizeDelta = new Vector2(104f, 104f);

                Text[] musicLabels = musicButton.GetComponentsInChildren<Text>(true);
                foreach (Text label in musicLabels)
                {
                    label.gameObject.SetActive(false);
                }

                Button soundButton = FindButton(loginRoot, "MuteSFX_Button");
                if (soundButton == null)
                {
                    soundButton = CreateIconButton("MuteSFX_Button", musicButton.transform.parent,
                        LoadSprite("Assets/Resources/UI/InGame/sound-on.png"),
                        musicRect.anchorMin, musicRect.anchoredPosition + new Vector2(-120f, 0f), new Vector2(104f, 104f));
                    soundButton.GetComponent<RectTransform>().anchorMax = musicRect.anchorMax;
                    soundButton.GetComponent<RectTransform>().pivot = musicRect.pivot;
                }
                else
                {
                    Image soundImage = soundButton.GetComponent<Image>();
                    soundImage.sprite = LoadSprite("Assets/Resources/UI/InGame/sound-on.png");
                    soundImage.preserveAspect = true;
                }

                PrefabUtility.SaveAsPrefabAsset(loginRoot, loginPath);
            }
            finally
            {
                PrefabUtility.UnloadPrefabContents(loginRoot);
            }
        }

        private static Button FindButton(GameObject root, string objectName)
        {
            Transform[] children = root.GetComponentsInChildren<Transform>(true);
            foreach (Transform child in children)
            {
                if (child.name == objectName)
                {
                    return child.GetComponent<Button>();
                }
            }

            return null;
        }

        private static void AddToScene()
        {
            var scene = EditorSceneManager.OpenScene(ScenePath);
            Canvas[] canvases = Object.FindObjectsByType<Canvas>(FindObjectsInactive.Include, FindObjectsSortMode.None);
            Canvas canvas = null;
            foreach (Canvas candidate in canvases)
            {
                if (candidate.transform.parent != null && candidate.transform.parent.name == "--- UI ---")
                {
                    canvas = candidate;
                    break;
                }
            }

            if (canvas == null) return;

            Transform existing = canvas.transform.Find("InGameUI");
            if (existing != null)
            {
                Object.DestroyImmediate(existing.gameObject);
            }

            GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(PrefabPath);
            GameObject instance = PrefabUtility.InstantiatePrefab(prefab, canvas.transform) as GameObject;
            instance.name = "InGameUI";
            instance.SetActive(false);
            Stretch(instance.GetComponent<RectTransform>());
            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene);
        }

        private static GameObject CreateOverlay(string name, Transform parent)
        {
            GameObject overlay = CreateObject(name, parent);
            Stretch(overlay.GetComponent<RectTransform>());
            Image image = overlay.AddComponent<Image>();
            image.color = new Color(0.02f, 0.025f, 0.03f, 0.76f);
            return overlay;
        }

        private static GameObject CreateBoard(string name, Transform parent, Vector2 size, Color color)
        {
            GameObject board = CreateObject(name, parent);
            SetRect(board.GetComponent<RectTransform>(), new Vector2(0.5f, 0.5f), Vector2.zero, size);
            Image image = board.AddComponent<Image>();
            image.color = color;
            Outline outline = board.AddComponent<Outline>();
            outline.effectColor = new Color(0.82f, 0.59f, 0.20f, 1f);
            outline.effectDistance = new Vector2(7f, -7f);
            return board;
        }

        private static void AddWoodBands(Transform parent, int count, Vector2 size)
        {
            float startY = (count - 1) * size.y * 0.5f;
            for (int i = 0; i < count; i++)
            {
                GameObject band = CreateObject("WoodBand_" + i, parent);
                SetRect(band.GetComponent<RectTransform>(), new Vector2(0.5f, 0.5f), new Vector2(0f, startY - i * size.y), size);
                Image image = band.AddComponent<Image>();
                image.color = i % 2 == 0
                    ? new Color(0.40f, 0.20f, 0.075f, 0.66f)
                    : new Color(0.30f, 0.13f, 0.045f, 0.66f);
                band.transform.SetAsFirstSibling();
            }
        }

        private static void CreateRecipeScroll(Transform parent, out RectTransform content, out GameObject template)
        {
            GameObject scrollObject = CreateObject("RecipeScroll", parent);
            SetRect(scrollObject.GetComponent<RectTransform>(), new Vector2(0.5f, 0.5f), new Vector2(0f, -60f), new Vector2(1280f, 820f));
            Image scrollBackground = scrollObject.AddComponent<Image>();
            scrollBackground.color = new Color(0.035f, 0.055f, 0.065f, 0.88f);
            ScrollRect scroll = scrollObject.AddComponent<ScrollRect>();
            scroll.horizontal = false;

            GameObject viewport = CreateObject("Viewport", scrollObject.transform);
            Stretch(viewport.GetComponent<RectTransform>());
            viewport.AddComponent<Image>().color = new Color(1f, 1f, 1f, 0.015f);
            viewport.AddComponent<RectMask2D>();

            GameObject contentObject = CreateObject("Content", viewport.transform);
            content = contentObject.GetComponent<RectTransform>();
            content.anchorMin = new Vector2(0f, 1f);
            content.anchorMax = new Vector2(1f, 1f);
            content.pivot = new Vector2(0.5f, 1f);
            content.anchoredPosition = Vector2.zero;
            content.sizeDelta = Vector2.zero;
            VerticalLayoutGroup layout = contentObject.AddComponent<VerticalLayoutGroup>();
            layout.padding = new RectOffset(24, 24, 24, 24);
            layout.spacing = 14f;
            layout.childControlWidth = true;
            layout.childControlHeight = true;
            layout.childForceExpandWidth = true;
            layout.childForceExpandHeight = false;
            ContentSizeFitter fitter = contentObject.AddComponent<ContentSizeFitter>();
            fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            scroll.viewport = viewport.GetComponent<RectTransform>();
            scroll.content = content;

            template = CreateObject("RecipeRowTemplate", content);
            template.GetComponent<RectTransform>().sizeDelta = new Vector2(1200f, 94f);
            Image background = template.AddComponent<Image>();
            background.color = new Color(0.16f, 0.23f, 0.25f, 0.94f);
            LayoutElement element = template.AddComponent<LayoutElement>();
            element.minWidth = 1100f;
            element.preferredWidth = 1200f;
            element.flexibleWidth = 1f;
            element.preferredHeight = 94f;
            Text label = CreateText("RecipeText", template.transform, "H  +  O  =  Water", 34, Vector2.zero, Vector2.zero, Color.white);
            Stretch(label.rectTransform);
            label.rectTransform.offsetMin = new Vector2(32f, 0f);
            label.rectTransform.offsetMax = new Vector2(-32f, 0f);
            label.alignment = TextAnchor.MiddleLeft;
        }

        private static Slider CreateSlider(string name, Transform parent, Vector2 position)
        {
            GameObject sliderObject = CreateObject(name, parent);
            SetRect(sliderObject.GetComponent<RectTransform>(), new Vector2(0.5f, 0.5f), position, new Vector2(330f, 68f));
            Slider slider = sliderObject.AddComponent<Slider>();
            slider.minValue = 0f;
            slider.maxValue = 1f;
            slider.value = 1f;

            GameObject background = CreateObject("Background", sliderObject.transform);
            SetRect(background.GetComponent<RectTransform>(), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(320f, 34f));
            background.AddComponent<Image>().color = new Color(0.10f, 0.08f, 0.04f, 1f);

            GameObject fillArea = CreateObject("Fill Area", sliderObject.transform);
            Stretch(fillArea.GetComponent<RectTransform>());
            fillArea.GetComponent<RectTransform>().offsetMin = new Vector2(12f, 17f);
            fillArea.GetComponent<RectTransform>().offsetMax = new Vector2(-12f, -17f);
            GameObject fill = CreateObject("Fill", fillArea.transform);
            Stretch(fill.GetComponent<RectTransform>());
            Image fillImage = fill.AddComponent<Image>();
            fillImage.color = new Color(0.37f, 0.75f, 0.24f, 1f);

            GameObject handleArea = CreateObject("Handle Slide Area", sliderObject.transform);
            Stretch(handleArea.GetComponent<RectTransform>());
            handleArea.GetComponent<RectTransform>().offsetMin = new Vector2(12f, 0f);
            handleArea.GetComponent<RectTransform>().offsetMax = new Vector2(-12f, 0f);
            GameObject handle = CreateObject("Handle", handleArea.transform);
            SetRect(handle.GetComponent<RectTransform>(), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(54f, 54f));
            Image handleImage = handle.AddComponent<Image>();
            handleImage.color = new Color(0.95f, 0.68f, 0.17f, 1f);

            slider.fillRect = fill.GetComponent<RectTransform>();
            slider.handleRect = handle.GetComponent<RectTransform>();
            slider.targetGraphic = handleImage;
            return slider;
        }

        private static List<Image> CreateDots(Transform parent, int count)
        {
            List<Image> dots = new List<Image>();
            float startX = -(count - 1) * 32f;
            for (int i = 0; i < count; i++)
            {
                GameObject dot = CreateObject("PageDot_" + i, parent);
                SetRect(dot.GetComponent<RectTransform>(), new Vector2(0.5f, 0.5f), new Vector2(startX + i * 64f, -270f), new Vector2(32f, 32f));
                Image image = dot.AddComponent<Image>();
                image.color = i == 0 ? Color.white : new Color(0.82f, 0.71f, 0.43f, 1f);
                Outline outline = dot.AddComponent<Outline>();
                outline.effectColor = new Color(0.05f, 0.05f, 0.05f, 1f);
                outline.effectDistance = new Vector2(3f, -3f);
                dots.Add(image);
            }
            return dots;
        }

        private static Button CreateButton(string name, Transform parent, string label, Vector2 position, Vector2 size)
        {
            GameObject buttonObject = CreateObject(name, parent);
            SetRect(buttonObject.GetComponent<RectTransform>(), new Vector2(0.5f, 0.5f), position, size);
            Image image = buttonObject.AddComponent<Image>();
            image.sprite = buttonSprite;
            image.type = Image.Type.Sliced;
            Button button = buttonObject.AddComponent<Button>();
            button.targetGraphic = image;
            Text text = CreateText("Text", buttonObject.transform, label, 38, Vector2.zero, Vector2.zero, Color.white);
            Stretch(text.rectTransform);
            return button;
        }

        private static Button CreateIconButton(string name, Transform parent, Sprite sprite, Vector2 anchor, Vector2 position, Vector2 size)
        {
            GameObject buttonObject = CreateObject(name, parent);
            SetRect(buttonObject.GetComponent<RectTransform>(), anchor, position, size);
            Image image = buttonObject.AddComponent<Image>();
            image.sprite = sprite;
            image.preserveAspect = true;
            Button button = buttonObject.AddComponent<Button>();
            button.targetGraphic = image;
            return button;
        }

        private static Text CreateText(string name, Transform parent, string value, int fontSize, Vector2 position, Vector2 size, Color color)
        {
            GameObject textObject = CreateObject(name, parent);
            SetRect(textObject.GetComponent<RectTransform>(), new Vector2(0.5f, 0.5f), position, size);
            Text text = textObject.AddComponent<Text>();
            text.text = value;
            text.font = bodyFont != null ? bodyFont : Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            text.fontSize = fontSize;
            text.fontStyle = FontStyle.Bold;
            text.alignment = TextAnchor.MiddleCenter;
            text.color = color;
            return text;
        }

        private static GameObject CreateObject(string name, Transform parent)
        {
            GameObject gameObject = new GameObject(name, typeof(RectTransform), typeof(CanvasRenderer));
            gameObject.layer = 5;
            if (parent != null)
            {
                gameObject.transform.SetParent(parent, false);
            }
            return gameObject;
        }

        private static void Set(SerializedObject serialized, string propertyName, Object value)
        {
            serialized.FindProperty(propertyName).objectReferenceValue = value;
        }

        private static Sprite LoadSprite(string path)
        {
            return AssetDatabase.LoadAssetAtPath<Sprite>(path);
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
    }
}
