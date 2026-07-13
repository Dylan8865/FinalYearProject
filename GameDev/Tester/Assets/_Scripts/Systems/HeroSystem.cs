using UnityEngine;

public class HeroSystem : Singleton<HeroSystem>
{
    [field: SerializeField] public HeroView HeroView { get; private set; }

    private void OnEnable()
    {
        ActionSystem.SubscribeReaction<EnemyTurnGA>(EndTurnPreReaction, ReactionTiming.PRE);
        ActionSystem.SubscribeReaction<EnemyTurnGA>(EndTurnPostReaction, ReactionTiming.POST);
    }
    private void OnDisable()
    {
        ActionSystem.UnsubscribeReaction<EnemyTurnGA>(EndTurnPreReaction, ReactionTiming.PRE);
        ActionSystem.UnsubscribeReaction<EnemyTurnGA>(EndTurnPostReaction, ReactionTiming.POST);
    }

    
    public void Setup(HeroData heroData)
    {
        HeroView.Setup(heroData);
    }

    // Reactions

    private void EndTurnPreReaction(EnemyTurnGA enemyTurnGA)
    {
        DiscardAllCardsGA discardAllCardsGA = new();
        ActionSystem.Instance.AddReaction(discardAllCardsGA);
    }

    private void EndTurnPostReaction(EnemyTurnGA enemyTurnGA)
    {
        int burnStacks = HeroView.GetStatusEffectStacks(StatusEffectType.BURN);
        if(burnStacks > 0)
        {
            ApplyBurnGA applyBurnGA = new(burnStacks, HeroView);
            ActionSystem.Instance.AddReaction(applyBurnGA);
        }

        int suffocateStacks = HeroView.GetStatusEffectStacks(StatusEffectType.SUFFOCATE);
        if(suffocateStacks > 0)
        {
            ApplySuffocateGA applySuffocateGA = new(suffocateStacks, HeroView);
            ActionSystem.Instance.AddReaction(applySuffocateGA);
        }

        int cardsInHand = CardSystem.Instance != null ? CardSystem.Instance.HandCount : 0;
        int cardsToDraw = Mathf.Max(0, 8 - cardsInHand);
        if (cardsToDraw > 0)
        {
            DrawCardsGA drawCardsGA = new(cardsToDraw);
            ActionSystem.Instance.AddReaction(drawCardsGA);
        }
    }

}
