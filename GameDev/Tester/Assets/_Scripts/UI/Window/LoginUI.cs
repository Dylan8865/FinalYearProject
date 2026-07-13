using UnityEngine;
using UnityEngine.UI;
using System.Collections;
using System.Collections.Generic;

// StartUI Is a UI Base. So it can use the methods in UIBase
public class LoginUI : UIBase
{
    private GameObject gameplayViewsRoot;
    private bool hasStarted;

    private void Awake()
    {
        gameplayViewsRoot = FindGameplayViewsRoot();
        BindButtons();
        SetGameplayUIVisible(false);
        SetGameplaySceneVisible(false);
    }

    private void BindButtons()
    {
        Button startButton = FindChild<Button>("startBtn");
        if (startButton != null)
        {
            startButton.onClick.RemoveListener(OnStartGameClicked);
            if (startButton.onClick.GetPersistentEventCount() == 0)
            {
                startButton.onClick.AddListener(OnStartGameClicked);
            }
        }

        Button quitButton = FindChild<Button>("quitBtn");
        if (quitButton != null)
        {
            quitButton.onClick.RemoveListener(OnQuitClicked);
            if (quitButton.onClick.GetPersistentEventCount() == 0)
            {
                quitButton.onClick.AddListener(OnQuitClicked);
            }
        }

        Button muteButton = FindChild<Button>("MuteBGM_Button");
        if (muteButton != null)
        {
            muteButton.onClick.RemoveListener(OnMuteClicked);
            if (muteButton.onClick.GetPersistentEventCount() == 0)
            {
                muteButton.onClick.AddListener(OnMuteClicked);
            }
        }

        Button muteSfxButton = FindChild<Button>("MuteSFX_Button");
        if (muteSfxButton != null)
        {
            muteSfxButton.onClick.RemoveListener(OnMuteSFXClicked);
            if (muteSfxButton.onClick.GetPersistentEventCount() == 0)
            {
                muteSfxButton.onClick.AddListener(OnMuteSFXClicked);
            }
        }

        Toggle muteToggle = FindChild<Toggle>("MuteBGM_Toggle");
        if (muteToggle != null)
        {
            muteToggle.onValueChanged.RemoveListener(OnMuteToggleChanged);
            muteToggle.isOn = AudioManager.Instance != null && AudioManager.Instance.IsBGMMuted();
            muteToggle.onValueChanged.AddListener(OnMuteToggleChanged);
        }

        RefreshMuteIcons();
    }

    public void OnStartGameClicked()
    {
        StartGame(true);
    }

    public void StartGameFromReload()
    {
        StartGame(false);
    }

    private void StartGame(bool playClickSound)
    {
        if (hasStarted) return;
        hasStarted = true;

        SetGameplaySceneVisible(true);
        SetGameplayUIVisible(true);

        // Start the game by calling MatchSetupSystem
        MatchSetupSystem setupSystem = FindObjectOfType<MatchSetupSystem>();
        if (setupSystem != null)
        {
            setupSystem.StartMatch();
        }

        // Play a click sound if AudioManager exists
        if (playClickSound && AudioManager.Instance != null)
        {
            AudioManager.Instance.PlayClickSound();
        }

        // Close this UI
        Close();
    }

    public void OnQuitClicked()
    {
        if (AudioManager.Instance != null)
        {
            AudioManager.Instance.PlayClickSound();
        }

#if UNITY_EDITOR
        UnityEditor.EditorApplication.isPlaying = false;
#else
        Application.Quit();
#endif
    }

    public void OnMuteClicked()
    {
        if (AudioManager.Instance != null)
        {
            AudioManager.Instance.ToggleMute();
            RefreshMuteIcons();
        }
    }

    public void OnMuteSFXClicked()
    {
        if (AudioManager.Instance != null)
        {
            AudioManager.Instance.ToggleSFXMute();
            RefreshMuteIcons();
        }
    }

    public void OnMuteToggleChanged(bool isMuted)
    {
        if (AudioManager.Instance != null)
        {
            AudioManager.Instance.SetMute(isMuted);
            RefreshMuteIcons();
        }
    }

    private void RefreshMuteIcons()
    {
        if (AudioManager.Instance == null) return;

        Image musicIcon = FindChild<Image>("MuteBGM_Button");
        Image soundIcon = FindChild<Image>("MuteSFX_Button");

        if (musicIcon != null)
        {
            musicIcon.sprite = Resources.Load<Sprite>(AudioManager.Instance.IsBGMMuted()
                ? "UI/InGame/music-off"
                : "UI/InGame/music-on");
            musicIcon.preserveAspect = true;
        }

        if (soundIcon != null)
        {
            soundIcon.sprite = Resources.Load<Sprite>(AudioManager.Instance.IsSFXMuted()
                ? "UI/InGame/sound-off"
                : "UI/InGame/sound-on");
            soundIcon.preserveAspect = true;
        }
    }

    private void SetGameplayUIVisible(bool visible)
    {
        SetCanvasChildVisible("EndTurnButtonUI", visible);
        SetCanvasChildVisible("ManaUI", visible);
        SetCanvasChildVisible("PerksUI", visible);
        SetCanvasChildVisible("InGameUI", visible);
    }

    private void SetGameplaySceneVisible(bool visible)
    {
        if (gameplayViewsRoot == null)
        {
            gameplayViewsRoot = FindGameplayViewsRoot();
        }

        if (gameplayViewsRoot != null)
        {
            gameplayViewsRoot.SetActive(visible);
        }
        else
        {
            Debug.LogWarning("LoginUI could not find the --- VIEWS --- gameplay root.");
        }
    }

    private void SetCanvasChildVisible(string childName, bool visible)
    {
        Canvas canvas = GetComponentInParent<Canvas>();
        if (canvas == null) return;

        Transform child = canvas.transform.Find(childName);
        if (child != null)
        {
            child.gameObject.SetActive(visible);
        }
    }

    private T FindChild<T>(string childName) where T : Component
    {
        Transform[] children = GetComponentsInChildren<Transform>(true);
        for (int i = 0; i < children.Length; i++)
        {
            if (children[i].name == childName)
            {
                return children[i].GetComponent<T>();
            }
        }

        return null;
    }

    private GameObject FindGameplayViewsRoot()
    {
        Transform[] allTransforms = Resources.FindObjectsOfTypeAll<Transform>();
        for (int i = 0; i < allTransforms.Length; i++)
        {
            Transform current = allTransforms[i];
            if (current.name == "--- VIEWS ---" && current.gameObject.scene.IsValid())
            {
                return current.gameObject;
            }
        }

        return null;
    }
}
