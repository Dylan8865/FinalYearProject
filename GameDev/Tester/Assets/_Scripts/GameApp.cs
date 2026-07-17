using UnityEngine;
using System.Collections;
using System.Collections.Generic;

public class GameApp : MonoBehaviour
{
    private static bool startGameplayOnLoad;

    public static void StartGameplayAfterReload()
    {
        startGameplayOnLoad = true;
    }

    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        if (GetComponent<GameSessionReporter>() == null)
        {
            gameObject.AddComponent<GameSessionReporter>();
        }

        LoginUI loginUI = UIManager.Instance.ShowUI<LoginUI>("LoginUI") as LoginUI;
        if (startGameplayOnLoad)
        {
            startGameplayOnLoad = false;
            loginUI?.StartGameFromReload();
            return;
        }

        if (AudioManager.Instance != null)
        {
            AudioManager.Instance.PlayBGM("bgm1");
        }
    }

    
}
