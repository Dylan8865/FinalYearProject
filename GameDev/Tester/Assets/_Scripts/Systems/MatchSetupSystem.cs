using UnityEngine;
using System.Collections.Generic;


public class MatchSetupSystem : MonoBehaviour
{
    [SerializeField] private HeroData heroData;

    [SerializeField] private PerkData perkData;

    [SerializeField] private List<EnemyWave> waves;
    
    public void StartMatch()
    {
        if (!CanStartMatch())
        {
            return;
        }

        HeroSystem.Instance.Setup(heroData);
        EnemySystem.Instance.Setup(waves);
        CardSystem.Instance.Setup(heroData.DropTable);
        PerkSystem.Instance.ClearPerks();
        PerkSystem.Instance.AddPerk(new Perk(perkData));
        RunProgressionSystem.Instance?.BeginRun(waves.Count);
        DrawCardsGA drawCardsGA = new(8);
        ActionSystem.Instance.Perform(drawCardsGA);
        if (AudioManager.Instance != null)
        {
            AudioManager.Instance.PlayBGM("battle");
        }
        GameSessionReporter.Instance?.ReportMatchStarted();
    }

    private bool CanStartMatch()
    {
        if (heroData == null)
        {
            Debug.LogError("MatchSetupSystem cannot start: heroData is missing.");
            return false;
        }

        if (perkData == null)
        {
            Debug.LogError("MatchSetupSystem cannot start: perkData is missing.");
            return false;
        }

        if (waves == null || waves.Count == 0)
        {
            Debug.LogError("MatchSetupSystem cannot start: waves are missing.");
            return false;
        }

        if (HeroSystem.Instance == null || HeroSystem.Instance.HeroView == null)
        {
            Debug.LogError("MatchSetupSystem cannot start: HeroSystem or HeroView is missing.");
            return false;
        }

        if (EnemySystem.Instance == null)
        {
            Debug.LogError("MatchSetupSystem cannot start: EnemySystem is missing.");
            return false;
        }

        if (CardSystem.Instance == null || CardSystem.Instance.HandView == null)
        {
            Debug.LogError("MatchSetupSystem cannot start: CardSystem or HandView is missing.");
            return false;
        }

        if (PerkSystem.Instance == null)
        {
            Debug.LogError("MatchSetupSystem cannot start: PerkSystem is missing.");
            return false;
        }

        if (ActionSystem.Instance == null)
        {
            Debug.LogError("MatchSetupSystem cannot start: ActionSystem is missing.");
            return false;
        }

        return true;
    }
}
