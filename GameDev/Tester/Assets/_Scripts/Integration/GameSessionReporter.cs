using System.Runtime.InteropServices;
using UnityEngine;

/// <summary>
/// Emits a small, schema-compatible game record to the Qubo parent page when
/// this project runs as a WebGL iframe. The parent owns authentication and all
/// persistence; Unity never receives a Qubo user ID or access token.
/// </summary>
public class GameSessionReporter : MonoBehaviour
{
    [System.Serializable]
    private class BridgeMessage
    {
        public string type;
        public int turn_number;
        public string effect_type;
        public int effect_value;
        public string winner;
        public int turns_played;
        public int score;
        public int waves_cleared;
        public bool is_victory;
        public int enemies_defeated;
        public int compounds_discovered;
        public int highest_combo;
    }

    public static GameSessionReporter Instance { get; private set; }

    private bool matchStarted;
    private bool matchCompleted;
    private int currentTurn = 1;

#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")]
    private static extern void QuboPostMessage(string message);
#endif

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(this);
            return;
        }

        Instance = this;
    }

    private void OnEnable()
    {
        ActionSystem.SubscribeReaction<PlayCardGA>(OnCardPlayed, ReactionTiming.POST);
        ActionSystem.SubscribeReaction<CombineCardsGA>(OnCardsCombined, ReactionTiming.POST);
        ActionSystem.SubscribeReaction<DealDamageGA>(OnDamageDealt, ReactionTiming.POST);
        ActionSystem.SubscribeReaction<KillEnemyGA>(OnEnemyDefeated, ReactionTiming.POST);
        ActionSystem.SubscribeReaction<EnemyTurnGA>(OnTurnEnded, ReactionTiming.POST);
    }

    private void OnDisable()
    {
        ActionSystem.UnsubscribeReaction<PlayCardGA>(OnCardPlayed, ReactionTiming.POST);
        ActionSystem.UnsubscribeReaction<CombineCardsGA>(OnCardsCombined, ReactionTiming.POST);
        ActionSystem.UnsubscribeReaction<DealDamageGA>(OnDamageDealt, ReactionTiming.POST);
        ActionSystem.UnsubscribeReaction<KillEnemyGA>(OnEnemyDefeated, ReactionTiming.POST);
        ActionSystem.UnsubscribeReaction<EnemyTurnGA>(OnTurnEnded, ReactionTiming.POST);
    }

    private void OnDestroy()
    {
        if (Instance == this)
        {
            Instance = null;
        }
    }

    public void ReportMatchStarted()
    {
        matchStarted = true;
        matchCompleted = false;
        currentTurn = 1;
        Post(new BridgeMessage { type = "qubo:match-started" });
    }

    public void ReportMatchCompleted(
        string winner,
        int turnsPlayed,
        int score,
        int wavesCleared,
        bool isVictory,
        int enemiesDefeated,
        int compoundsDiscovered,
        int highestCombo)
    {
        if (!matchStarted || matchCompleted) return;

        matchCompleted = true;
        Post(new BridgeMessage
        {
            type = "qubo:match-completed",
            winner = winner,
            turns_played = Mathf.Max(turnsPlayed, currentTurn - 1),
            score = Mathf.Max(0, score),
            waves_cleared = Mathf.Max(0, wavesCleared),
            is_victory = isVictory,
            enemies_defeated = Mathf.Max(0, enemiesDefeated),
            compounds_discovered = Mathf.Max(0, compoundsDiscovered),
            highest_combo = Mathf.Max(0, highestCombo)
        });
    }

    private void OnCardPlayed(PlayCardGA _)
    {
        ReportEvent("card_played", 0);
    }

    private void OnCardsCombined(CombineCardsGA _)
    {
        ReportEvent("cards_combined", 0);
    }

    private void OnDamageDealt(DealDamageGA action)
    {
        int amount = action.Amount;
        if (!action.IgnoresAttackBonus && action.Caster is HeroView hero)
        {
            amount += hero.AttackBonus;
        }

        ReportEvent(action.Caster is HeroView ? "damage_dealt" : "damage_taken", amount);
    }

    private void OnEnemyDefeated(KillEnemyGA _)
    {
        ReportEvent("enemy_defeated", 1);
    }

    private void OnTurnEnded(EnemyTurnGA _)
    {
        ReportEvent("turn_ended", 0);
        currentTurn++;
    }

    private void ReportEvent(string effectType, int effectValue)
    {
        if (!matchStarted || matchCompleted) return;

        Post(new BridgeMessage
        {
            type = "qubo:match-event",
            turn_number = currentTurn,
            effect_type = effectType,
            effect_value = effectValue
        });
    }

    private static void Post(BridgeMessage message)
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        QuboPostMessage(JsonUtility.ToJson(message));
#endif
    }
}
