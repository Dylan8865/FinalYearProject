using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using DG.Tweening;


public class CardSystem : Singleton<CardSystem>
{
    private const int MaxHandSize = 8;

    [SerializeField] private HandView handView;
    public HandView HandView => handView;

    [SerializeField] private Transform drawPilePoint;

    [SerializeField] private Transform discardPilePoint;

    private List<CardDropRate> dropTable = new();
    private int totalDropWeight = 0;

    private readonly List<Card> hand = new();
    public int HandCount => hand.Count;
    
    private void OnEnable()
    {
        ActionSystem.AttachPerformer<DrawCardsGA>(DrawCardsPerformer);
        ActionSystem.AttachPerformer<DiscardAllCardsGA>(DiscardAllCardsPerformer);
        ActionSystem.AttachPerformer<PlayCardGA>(PlayCardPerformer);
        ActionSystem.AttachPerformer<CombineCardsGA>(CombineCardsPerformer);
    }
    private void OnDisable()
    {
        ActionSystem.DetachPerformer<DrawCardsGA>();
        ActionSystem.DetachPerformer<DiscardAllCardsGA>();
        ActionSystem.DetachPerformer<PlayCardGA>();
        ActionSystem.DetachPerformer<CombineCardsGA>();
    }

    // Publics

    public void Setup(List<CardDropRate> heroDropTable)
    {
        dropTable = heroDropTable;
        totalDropWeight = 0;
        foreach (var dropRate in dropTable)
        {
            totalDropWeight += dropRate.Weight;
        }
    }

    // Performers

    private IEnumerator DrawCardsPerformer(DrawCardsGA drawCardsGA)
    {
        int cardsToDraw = drawCardsGA.RespectMaxHandSize
            ? Mathf.Min(drawCardsGA.Amount, MaxHandSize - hand.Count)
            : drawCardsGA.Amount;
        for(int i = 0; i < cardsToDraw; i++)
        {
            yield return DrawCard(drawCardsGA.RespectMaxHandSize);
        }
    }

    private IEnumerator DiscardAllCardsPerformer(DiscardAllCardsGA discardAllCardsGA)
    {
        List<Card> cardsToDiscard = new(hand);
        hand.Clear();

        foreach (var card in cardsToDiscard)
        {
            CardView cardView = handView.RemoveCard(card);
            yield return DiscardCard(cardView);
        }
    }

    private IEnumerator PlayCardPerformer(PlayCardGA playCardGA)
    {
        hand.Remove(playCardGA.Card);
        CardView cardView = handView.RemoveCard(playCardGA.Card);
        yield return DiscardCard(cardView);
        AudioManager.Instance?.PlayCardPlaceSound();

        SpendManaGA spendManaGA = new(playCardGA.Card.Mana);
        ActionSystem.Instance.AddReaction(spendManaGA);

        if (playCardGA.Card.ManualTargetEffect != null)
        {
            PerformEffectGA performEffectGA = new(playCardGA.Card.ManualTargetEffect, new(){ playCardGA.ManualTarget });
            ActionSystem.Instance.AddReaction(performEffectGA);
        }

        foreach (var effectWrapper in playCardGA.Card.OtherEffects)
        {
            List<CombatantView> targets = effectWrapper.TargetMode.GetTargets();
            PerformEffectGA performEffectGA = new(effectWrapper.Effect, targets);
            ActionSystem.Instance.AddReaction(performEffectGA);
        }
    }

    private IEnumerator CombineCardsPerformer(CombineCardsGA combineCardsGA)
    {
        CardData newCardData = RecipeManager.GetCombinedCard(combineCardsGA.CardA.Tittle, combineCardsGA.CardB.Tittle);
        if (newCardData == null) yield break;

        hand.Remove(combineCardsGA.CardA);
        hand.Remove(combineCardsGA.CardB);

        CardView cardViewA = handView.RemoveCard(combineCardsGA.CardA);
        CardView cardViewB = handView.RemoveCard(combineCardsGA.CardB);

        yield return DiscardCard(cardViewA);
        yield return DiscardCard(cardViewB);

        Card combinedCard = new Card(newCardData);
        hand.Add(combinedCard);
        CardView combinedCardView = CardViewCreator.Instance.CreateCardView(combinedCard, drawPilePoint.position, drawPilePoint.rotation);
        
        yield return handView.AddCard(combinedCardView);
        AudioManager.Instance?.PlayCombineSound();
        RunProgressionSystem.Instance?.RegisterCompound(newCardData.name);
    }


    // Helpers
    private IEnumerator DrawCard(bool respectMaxHandSize)
    {
        if (respectMaxHandSize && hand.Count >= MaxHandSize) yield break;
        if (totalDropWeight <= 0) yield break;

        int randomValue = UnityEngine.Random.Range(0, totalDropWeight);
        CardData selectedCardData = null;
        int currentWeight = 0;
        
        foreach (var dropRate in dropTable)
        {
            currentWeight += dropRate.Weight;
            if (randomValue < currentWeight)
            {
                selectedCardData = dropRate.CardData;
                break;
            }
        }

        if (selectedCardData != null)
        {
            Card card = new(selectedCardData);
            hand.Add(card);
            CardView cardView = CardViewCreator.Instance.CreateCardView(card, drawPilePoint.position, drawPilePoint.rotation);
            yield return handView.AddCard(cardView);
            AudioManager.Instance?.PlayDrawSound();
        }
    }

    private IEnumerator DiscardCard(CardView cardView)
    {
        if (cardView == null) yield break;

        cardView.CancelPointerInteraction();
        cardView.transform.DOKill();
        cardView.transform.DOScale(Vector3.zero, 0.15f);
        Tween tween = cardView.transform.DOMove(discardPilePoint.position, 0.15f);
        yield return tween.WaitForCompletion();
        cardView.transform.DOKill();
        Destroy(cardView.gameObject);
    }
   
    
}
