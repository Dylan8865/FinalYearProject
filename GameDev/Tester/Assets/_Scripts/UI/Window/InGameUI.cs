using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class InGameUI : UIBase
{
    private const string TutorialSeenKey = "InGameTutorialSeen";

    [Header("HUD")]
    [SerializeField] private GameObject hudRoot;
    [SerializeField] private Button pauseButton;
    [SerializeField] private Button recipeButton;
    [SerializeField] private Text scoreText;
    [SerializeField] private Text waveText;
    [SerializeField] private Text comboText;

    [Header("Pause")]
    [SerializeField] private GameObject pausePanel;
    [SerializeField] private Button playButton;
    [SerializeField] private Button restartButton;
    [SerializeField] private Button optionsButton;
    [SerializeField] private Button quitButton;

    [Header("Options")]
    [SerializeField] private GameObject optionsPanel;
    [SerializeField] private Slider musicSlider;
    [SerializeField] private Slider soundSlider;
    [SerializeField] private Button musicMuteButton;
    [SerializeField] private Button soundMuteButton;
    [SerializeField] private Image musicMuteIcon;
    [SerializeField] private Image soundMuteIcon;
    [SerializeField] private Sprite musicOnSprite;
    [SerializeField] private Sprite musicOffSprite;
    [SerializeField] private Sprite soundOnSprite;
    [SerializeField] private Sprite soundOffSprite;
    [SerializeField] private Button optionsCloseButton;

    [Header("Recipe Book")]
    [SerializeField] private GameObject recipePanel;
    [SerializeField] private RectTransform recipeContent;
    [SerializeField] private GameObject recipeRowTemplate;
    [SerializeField] private Button recipeCloseButton;
    [SerializeField] private Button tutorialButton;

    [Header("Tutorial")]
    [SerializeField] private GameObject tutorialPanel;
    [SerializeField] private Text tutorialTitle;
    [SerializeField] private Text tutorialBody;
    [SerializeField] private Button tutorialPreviousButton;
    [SerializeField] private Button tutorialNextButton;
    [SerializeField] private Button tutorialCloseButton;
    [SerializeField] private List<Image> tutorialDots = new List<Image>();

    [Header("Progression")]
    [SerializeField] private GameObject waveRewardPanel;
    [SerializeField] private Text waveRewardSubtitle;
    [SerializeField] private Button healRewardButton;
    [SerializeField] private Button maxHealthRewardButton;
    [SerializeField] private Button attackRewardButton;
    [SerializeField] private GameObject finalReportPanel;
    [SerializeField] private Text finalReportText;
    [SerializeField] private Button finalRestartButton;
    [SerializeField] private Button finalMenuButton;

    private readonly string[] tutorialTitles =
    {
        "PLAY A CARD",
        "COMBINE ELEMENTS",
        "SURVIVE THE WAVE",
        "CHECK RECIPES"
    };

    private readonly string[] tutorialBodies =
    {
        "Drag a playable card from your hand onto the battlefield. Targeted cards ask you to select an enemy.",
        "Drag one element card onto a compatible element card. A successful pair becomes a compound card.",
        "Spend mana carefully, then press END TURN. Defeat every enemy to advance to the next wave.",
        "Open the book in the top-right corner whenever you need to review all valid element combinations."
    };

    private int tutorialPage;
    private bool recipeRowsBuilt;

    private void Awake()
    {
        BindControls();
        BuildRecipeRows();
        HideAllPanels();
        SyncAudioControls();
    }

    private void OnEnable()
    {
        if (hudRoot != null)
        {
            hudRoot.SetActive(true);
        }

        if (PlayerPrefs.GetInt(TutorialSeenKey, 0) == 0)
        {
            OpenTutorial();
        }
    }

    private void OnDestroy()
    {
        Time.timeScale = 1f;
    }

    private void BindControls()
    {
        Bind(pauseButton, OpenPause);
        Bind(recipeButton, OpenRecipeBook);
        Bind(playButton, ResumeGame);
        Bind(restartButton, RestartGame);
        Bind(optionsButton, OpenOptions);
        Bind(quitButton, ReturnToMainMenu);
        Bind(optionsCloseButton, CloseOptions);
        Bind(recipeCloseButton, CloseRecipeBook);
        Bind(tutorialButton, OpenTutorial);
        Bind(musicMuteButton, ToggleMusicMute);
        Bind(soundMuteButton, ToggleSoundMute);
        Bind(tutorialPreviousButton, PreviousTutorialPage);
        Bind(tutorialNextButton, NextTutorialPage);
        Bind(tutorialCloseButton, CloseTutorial);
        Bind(healRewardButton, ChooseHealReward);
        Bind(maxHealthRewardButton, ChooseMaxHealthReward);
        Bind(attackRewardButton, ChooseAttackReward);
        Bind(finalRestartButton, RestartGame);
        Bind(finalMenuButton, ReturnToMainMenu);

        if (musicSlider != null)
        {
            musicSlider.onValueChanged.RemoveListener(OnMusicVolumeChanged);
            musicSlider.onValueChanged.AddListener(OnMusicVolumeChanged);
        }

        if (soundSlider != null)
        {
            soundSlider.onValueChanged.RemoveListener(OnSoundVolumeChanged);
            soundSlider.onValueChanged.AddListener(OnSoundVolumeChanged);
        }
    }

    private void Bind(Button button, UnityEngine.Events.UnityAction action)
    {
        if (button == null) return;
        button.onClick.RemoveListener(action);
        button.onClick.AddListener(action);
    }

    public void OpenPause()
    {
        PauseTime();
        ShowOnly(pausePanel);
    }

    public void ResumeGame()
    {
        HideAllPanels();
        Time.timeScale = 1f;
    }

    public void RestartGame()
    {
        Time.timeScale = 1f;
        GameApp.StartGameplayAfterReload();
        SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
    }

    public void ReturnToMainMenu()
    {
        Time.timeScale = 1f;
        SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
    }

    public void OpenOptions()
    {
        PauseTime();
        SyncAudioControls();
        ShowOnly(optionsPanel);
    }

    public void CloseOptions()
    {
        ShowOnly(pausePanel);
    }

    public void OpenRecipeBook()
    {
        PauseTime();
        BuildRecipeRows();
        ShowOnly(recipePanel);
    }

    public void CloseRecipeBook()
    {
        HideAllPanels();
        Time.timeScale = 1f;
    }

    public void OpenTutorial()
    {
        PauseTime();
        tutorialPage = 0;
        ShowOnly(tutorialPanel);
        RefreshTutorialPage();
    }

    public void CloseTutorial()
    {
        PlayerPrefs.SetInt(TutorialSeenKey, 1);
        PlayerPrefs.Save();
        HideAllPanels();
        Time.timeScale = 1f;
    }

    public void PreviousTutorialPage()
    {
        tutorialPage = Mathf.Max(0, tutorialPage - 1);
        RefreshTutorialPage();
    }

    public void NextTutorialPage()
    {
        if (tutorialPage >= tutorialTitles.Length - 1)
        {
            CloseTutorial();
            return;
        }

        tutorialPage++;
        RefreshTutorialPage();
    }

    public void ToggleMusicMute()
    {
        if (AudioManager.Instance == null) return;
        AudioManager.Instance.ToggleMute();
        SyncAudioControls();
    }

    public void ToggleSoundMute()
    {
        if (AudioManager.Instance == null) return;
        AudioManager.Instance.ToggleSFXMute();
        SyncAudioControls();
    }

    public void OnMusicVolumeChanged(float value)
    {
        AudioManager.Instance?.SetBGMVolume(value);
    }

    public void OnSoundVolumeChanged(float value)
    {
        AudioManager.Instance?.SetSFXVolume(value);
    }

    public void UpdateProgressHUD(int score, int combo, int currentWave, int totalWaves)
    {
        if (scoreText != null)
        {
            scoreText.text = "SCORE  " + score.ToString("N0");
        }

        if (waveText != null)
        {
            waveText.text = "WAVE  " + currentWave + " / " + totalWaves;
        }

        if (comboText != null)
        {
            comboText.text = combo > 1 ? "COMBO  x" + combo : string.Empty;
        }
    }

    public void ShowWaveReward(int completedWave, bool perfectWave)
    {
        PauseTime();
        if (waveRewardSubtitle != null)
        {
            waveRewardSubtitle.text = "WAVE " + completedWave + " CLEARED"
                + (perfectWave ? "\nPERFECT WAVE  +250" : "\nCHOOSE ONE UPGRADE");
        }
        ShowOnly(waveRewardPanel);
    }

    public void ShowFinalReport(
        int score,
        int highScore,
        int wavesCleared,
        int totalWaves,
        int enemiesDefeated,
        int compoundsDiscovered,
        int highestCombo,
        int turnsUsed,
        string grade)
    {
        PauseTime();
        if (finalReportText != null)
        {
            finalReportText.text =
                "EXPERIMENT COMPLETE\n\n"
                + grade + "\n\n"
                + "SCORE                     " + score.ToString("N0") + "\n"
                + "HIGH SCORE                " + highScore.ToString("N0") + "\n"
                + "WAVES CLEARED             " + wavesCleared + " / " + totalWaves + "\n"
                + "ENEMIES DEFEATED          " + enemiesDefeated + "\n"
                + "COMPOUNDS DISCOVERED      " + compoundsDiscovered + " / " + RecipeManager.Recipes.Count + "\n"
                + "HIGHEST COMBO             x" + highestCombo + "\n"
                + "TURNS USED                " + turnsUsed;
        }
        ShowOnly(finalReportPanel);
    }

    public void HideProgressionPanels()
    {
        HideAllPanels();
        Time.timeScale = 1f;
    }

    private void ChooseHealReward()
    {
        RunProgressionSystem.Instance?.ChooseReward(RunProgressionSystem.RewardType.Heal);
    }

    private void ChooseMaxHealthReward()
    {
        RunProgressionSystem.Instance?.ChooseReward(RunProgressionSystem.RewardType.MaxHealth);
    }

    private void ChooseAttackReward()
    {
        RunProgressionSystem.Instance?.ChooseReward(RunProgressionSystem.RewardType.Attack);
    }

    private void SyncAudioControls()
    {
        AudioManager audio = AudioManager.Instance;
        if (audio == null) return;

        if (musicSlider != null)
        {
            musicSlider.SetValueWithoutNotify(audio.GetBGMVolume());
        }

        if (soundSlider != null)
        {
            soundSlider.SetValueWithoutNotify(audio.GetSFXVolume());
        }

        if (musicMuteIcon != null)
        {
            musicMuteIcon.sprite = audio.IsBGMMuted() ? musicOffSprite : musicOnSprite;
        }

        if (soundMuteIcon != null)
        {
            soundMuteIcon.sprite = audio.IsSFXMuted() ? soundOffSprite : soundOnSprite;
        }
    }

    private void BuildRecipeRows()
    {
        if (recipeRowsBuilt || recipeContent == null || recipeRowTemplate == null) return;

        IReadOnlyList<RecipeManager.RecipeDefinition> recipes = RecipeManager.Recipes;
        for (int i = 0; i < recipes.Count; i++)
        {
            RecipeManager.RecipeDefinition recipe = recipes[i];
            GameObject row = Instantiate(recipeRowTemplate, recipeContent);
            row.name = "Recipe_" + recipe.CompoundName;
            row.SetActive(true);

            Text label = row.GetComponentInChildren<Text>(true);
            if (label != null)
            {
                CardData compound = Resources.Load<CardData>("Cards/" + recipe.CompoundName);
                string formula = compound != null && !string.IsNullOrWhiteSpace(compound.Formula)
                    ? "  (" + FormatFormula(compound.Formula) + ")"
                    : string.Empty;
                string effect = compound != null ? FormatEffectDescription(compound.Description) : string.Empty;
                label.text = recipe.ElementA + "  +  " + recipe.ElementB + "  =  " + recipe.CompoundName + formula + effect;
            }

            Image background = row.GetComponent<Image>();
            if (background != null && i % 2 == 1)
            {
                background.color = new Color(0.22f, 0.29f, 0.31f, 0.92f);
            }
        }

        recipeRowTemplate.SetActive(false);
        recipeRowsBuilt = true;
    }

    private string FormatFormula(string formula)
    {
        return formula.Replace("<sub>", string.Empty)
            .Replace("</sub>", string.Empty)
            .Trim();
    }

    private string FormatEffectDescription(string description)
    {
        if (string.IsNullOrWhiteSpace(description))
        {
            return string.Empty;
        }

        string effect = description.Trim()
            .Replace("armor", "shield")
            .Replace("Armor", "Shield")
            .Replace(" round", string.Empty)
            .Replace("Explosion", string.Empty)
            .Trim();

        return "  -  " + effect;
    }

    private void RefreshTutorialPage()
    {
        if (tutorialTitle != null)
        {
            tutorialTitle.text = tutorialTitles[tutorialPage];
        }

        if (tutorialBody != null)
        {
            tutorialBody.text = tutorialBodies[tutorialPage];
        }

        if (tutorialPreviousButton != null)
        {
            tutorialPreviousButton.interactable = tutorialPage > 0;
        }

        Text nextText = tutorialNextButton != null ? tutorialNextButton.GetComponentInChildren<Text>(true) : null;
        if (nextText != null)
        {
            nextText.text = tutorialPage == tutorialTitles.Length - 1 ? "DONE" : ">";
        }

        for (int i = 0; i < tutorialDots.Count; i++)
        {
            tutorialDots[i].color = i == tutorialPage
                ? Color.white
                : new Color(0.82f, 0.71f, 0.43f, 1f);
        }
    }

    private void PauseTime()
    {
        Time.timeScale = 0f;

        CardView[] cards = FindObjectsByType<CardView>(FindObjectsSortMode.None);
        for (int i = 0; i < cards.Length; i++)
        {
            cards[i].CancelPointerInteraction();
        }

        if (CardSystem.Instance != null && CardSystem.Instance.HandView != null)
        {
            CardSystem.Instance.HandView.RepositionCards(0.15f);
        }
    }

    private void ShowOnly(GameObject panel)
    {
        if (pausePanel != null) pausePanel.SetActive(panel == pausePanel);
        if (optionsPanel != null) optionsPanel.SetActive(panel == optionsPanel);
        if (recipePanel != null) recipePanel.SetActive(panel == recipePanel);
        if (tutorialPanel != null) tutorialPanel.SetActive(panel == tutorialPanel);
        if (waveRewardPanel != null) waveRewardPanel.SetActive(panel == waveRewardPanel);
        if (finalReportPanel != null) finalReportPanel.SetActive(panel == finalReportPanel);
    }

    private void HideAllPanels()
    {
        ShowOnly(null);
    }
}
