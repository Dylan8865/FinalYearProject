using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class GameOverUI : UIBase
{
    private void Awake()
    {
        BindButtons();
        EnterGameOverState();
    }

    public override void Show()
    {
        base.Show();
        EnterGameOverState();
    }

    private void EnterGameOverState()
    {
        Time.timeScale = 0f;
        CancelCardInteractions();

        if (AudioManager.Instance != null)
        {
            AudioManager.Instance.StopBGM();
            AudioManager.Instance.PlayLoseSound();
        }
    }

    private void BindButtons()
    {
        Button retryButton = FindChild<Button>("retryBtn");
        if (retryButton == null)
        {
            retryButton = FindChild<Button>("RetryButton");
        }

        if (retryButton != null)
        {
            retryButton.onClick.RemoveListener(OnRetryClicked);
            retryButton.onClick.AddListener(OnRetryClicked);
        }

        Button mainMenuButton = FindChild<Button>("MainMenuButton");
        if (mainMenuButton == null)
        {
            mainMenuButton = FindChild<Button>("MuteBGM_Button");
        }

        if (mainMenuButton != null)
        {
            mainMenuButton.onClick.RemoveListener(OnMuteClicked);
            mainMenuButton.onClick.RemoveListener(OnMainMenuClicked);
            mainMenuButton.onClick.AddListener(OnMainMenuClicked);
        }

        Toggle muteToggle = FindChild<Toggle>("MuteBGM_Toggle");
        if (muteToggle != null)
        {
            muteToggle.onValueChanged.RemoveListener(OnMuteToggleChanged);
            muteToggle.isOn = AudioManager.Instance != null && AudioManager.Instance.IsBGMMuted();
            muteToggle.onValueChanged.AddListener(OnMuteToggleChanged);
        }
    }

    public void OnRetryClicked()
    {
        if (AudioManager.Instance != null)
        {
            AudioManager.Instance.PlayClickSound();
        }

        Time.timeScale = 1f;
        GameApp.StartGameplayAfterReload();
        SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
    }

    public void OnMainMenuClicked()
    {
        if (AudioManager.Instance != null)
        {
            AudioManager.Instance.PlayClickSound();
        }

        Time.timeScale = 1f;
        SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
    }

    public void OnMuteClicked()
    {
        OnMainMenuClicked();
    }

    public void OnMuteToggleChanged(bool isMuted)
    {
        if (AudioManager.Instance != null)
        {
            AudioManager.Instance.SetMute(isMuted);
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

    private void CancelCardInteractions()
    {
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
}
