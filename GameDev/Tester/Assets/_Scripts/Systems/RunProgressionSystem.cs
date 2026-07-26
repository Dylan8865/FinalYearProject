using System;
using System.Collections.Generic;
using UnityEngine;

public class RunProgressionSystem : MonoBehaviour
{
    private const string HighScoreKey = "ExperimentHighScore";

    public enum RewardType
    {
        Heal,
        MaxHealth,
        Attack
    }

    public static RunProgressionSystem Instance { get; private set; }

    public int Score { get; private set; }
    public int Combo { get; private set; }
    public int HighestCombo { get; private set; }
    public int WavesCleared { get; private set; }
    public int EnemiesDefeated { get; private set; }
    public int TurnsUsed { get; private set; }
    public int CompoundsDiscovered => discoveredCompounds.Count;

    private readonly HashSet<string> discoveredCompounds = new HashSet<string>();
    private InGameUI inGameUI;
    private Action pendingNextWave;
    private int totalWaves;
    private int waveStartHealth;
    private bool runFinished;

    private void Awake()
    {
        Instance = this;
        inGameUI = GetComponent<InGameUI>();
    }

    private void OnDestroy()
    {
        if (Instance == this)
        {
            Instance = null;
        }
    }

    public void BeginRun(int waveCount)
    {
        Score = 0;
        Combo = 0;
        HighestCombo = 0;
        WavesCleared = 0;
        EnemiesDefeated = 0;
        TurnsUsed = 0;
        totalWaves = waveCount;
        runFinished = false;
        discoveredCompounds.Clear();
        BeginWave();
        RefreshHUD();
    }

    public void RegisterEnemyDefeated()
    {
        if (runFinished) return;
        EnemiesDefeated++;
        AddScore(100);
    }

    public void RegisterCompound(string compoundName)
    {
        if (runFinished || string.IsNullOrWhiteSpace(compoundName)) return;

        Combo++;
        HighestCombo = Mathf.Max(HighestCombo, Combo);
        AddScore(150 * Combo);

        if (discoveredCompounds.Add(compoundName))
        {
            AddScore(300);
        }
    }

    public void RegisterTurnEnded()
    {
        if (runFinished) return;
        TurnsUsed++;
        Combo = 0;
        RefreshHUD();
    }

    public void CompleteCurrentWave(Action startNextWave)
    {
        if (runFinished) return;

        WavesCleared++;
        bool perfectWave = HeroSystem.Instance != null
            && HeroSystem.Instance.HeroView != null
            && HeroSystem.Instance.HeroView.CurrentHealth >= waveStartHealth;

        AddScore(300 * WavesCleared);
        if (perfectWave)
        {
            AddScore(250);
        }

        if (WavesCleared >= totalWaves)
        {
            FinishRun();
            return;
        }

        pendingNextWave = startNextWave;
        inGameUI?.ShowWaveReward(WavesCleared, perfectWave);
    }

    public void ChooseReward(RewardType rewardType)
    {
        HeroView hero = HeroSystem.Instance != null ? HeroSystem.Instance.HeroView : null;
        if (hero == null) return;

        switch (rewardType)
        {
            case RewardType.Heal:
                hero.Heal(20);
                break;
            case RewardType.MaxHealth:
                hero.IncreaseMaxHealth(15, true);
                break;
            case RewardType.Attack:
                hero.AddAttackBonus(2);
                break;
        }

        AddScore(100);
        inGameUI?.HideProgressionPanels();
        BeginWave();

        Action continuation = pendingNextWave;
        pendingNextWave = null;
        continuation?.Invoke();
    }

    private void BeginWave()
    {
        HeroView hero = HeroSystem.Instance != null ? HeroSystem.Instance.HeroView : null;
        waveStartHealth = hero != null ? hero.CurrentHealth : 0;
        Combo = 0;
        RefreshHUD();
    }

    private void FinishRun()
    {
        runFinished = true;
        HeroView hero = HeroSystem.Instance != null ? HeroSystem.Instance.HeroView : null;
        int healthBonus = hero != null ? hero.CurrentHealth * 10 : 0;
        AddScore(healthBonus);

        int previousHighScore = PlayerPrefs.GetInt(HighScoreKey, 0);
        int highScore = Mathf.Max(previousHighScore, Score);
        PlayerPrefs.SetInt(HighScoreKey, highScore);
        PlayerPrefs.Save();

        GameSessionReporter.Instance?.ReportMatchCompleted(
            "player",
            TurnsUsed,
            Score,
            WavesCleared,
            true,
            EnemiesDefeated,
            CompoundsDiscovered,
            HighestCombo);

        inGameUI?.ShowFinalReport(
            Score,
            highScore,
            WavesCleared,
            totalWaves,
            EnemiesDefeated,
            CompoundsDiscovered,
            HighestCombo,
            TurnsUsed,
            GetGrade(Score));
    }

    private string GetGrade(int score)
    {
        if (score >= 7000) return "S - MASTER CHEMIST";
        if (score >= 5000) return "A - SENIOR RESEARCHER";
        if (score >= 3000) return "B - LAB ASSISTANT";
        return "C - CHEMISTRY STUDENT";
    }

    private void AddScore(int amount)
    {
        Score += Mathf.Max(0, amount);
        RefreshHUD();
    }

    private void RefreshHUD()
    {
        inGameUI?.UpdateProgressHUD(
            Score,
            Combo,
            Mathf.Min(WavesCleared + 1, Mathf.Max(1, totalWaves)),
            Mathf.Max(1, totalWaves));
    }
}
