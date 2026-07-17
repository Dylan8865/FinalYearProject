using UnityEngine.Splines;
using UnityEngine;
using DG.Tweening;
using System.Collections;
using System.Collections.Generic;
using System.Linq;


public class HandView : MonoBehaviour
{
    [SerializeField] private SplineContainer splineContainer;
    private readonly List<CardView> cards = new();
    public IReadOnlyList<CardView> Cards => cards;

    
    public IEnumerator AddCard(CardView cardView)
    {
        cards.Add(cardView);
        yield return UpdateCardPositions(0.15f);
    }

    public CardView RemoveCard(Card card)
    {
        CardView cardView = GetCardView(card);
        if (cardView == null) return null;
        cards.Remove(cardView);
        cardView.CancelPointerInteraction();
        cardView.transform.DOKill();
        StartCoroutine(UpdateCardPositions(0.15f));
        return cardView;
        
    }
    private CardView GetCardView(Card card)
    {
        return cards.Where(cardView => cardView.Card == card).FirstOrDefault();
    }
    
    public void RepositionCards(float duration = 0.15f)
    {
        StartCoroutine(UpdateCardPositions(duration));
    }

    private IEnumerator UpdateCardPositions(float duration)
    {
        cards.RemoveAll(card => card == null);
        if (cards.Count == 0) yield break;

        float cardSpacing = 1f / 10f;
        float firstCardPosition = 0.5f - (cards.Count - 1) * cardSpacing / 2;
        Spline spline = splineContainer.Spline;
        for (int i = 0; i < cards.Count; i++)
        {
            if (cards[i] == null) continue;

            float p = firstCardPosition + i * cardSpacing;
            Vector3 splinePosition = spline.EvaluatePosition(p);
            Vector3 forward = spline.EvaluateTangent(p);
            Vector3 up = spline.EvaluateUpVector(p);
            // Swap '-up' to 'up' to make the cards twist back around to face the camera
            Quaternion rotation = Quaternion.LookRotation(-up, Vector3.Cross(forward, -up).normalized);
// Multiply by a 180-degree rotation around the Y axis to flip it to the front side
            rotation *= Quaternion.Euler(0, 180, 0);
            Transform cardTransform = cards[i].transform;
            cardTransform.DOKill();
            cardTransform.DOMove(splinePosition + transform.position + 0.01f * i * Vector3.back, duration);
            cardTransform.DORotate(rotation.eulerAngles, duration);
            cardTransform.DOScale(Vector3.one, duration);
        }
        yield return new WaitForSeconds(duration);
    }
}
