using UnityEngine;
using TMPro;
using System.Collections.Generic;
using System.Linq;
using DG.Tweening;

public class CardView : MonoBehaviour
{

    [SerializeField] private TMP_Text tittle;

    [SerializeField] private TMP_Text description;

    [SerializeField] private TMP_Text mana;

    [SerializeField] private TMP_Text formula;

    [SerializeField] private SpriteRenderer imageSR;

    [SerializeField] private GameObject wrapper;
    
    [SerializeField] private LayerMask dropLayer;

    public Card Card { get; private set; }

    private Vector3 dragStartPosition;

    private Quaternion dragStartRotation;

    private bool isBeingDragged;

    private GameObject glowObject;
    private SpriteRenderer glowRenderer;

    // When false, this CardView does not respond to mouse events (e.g. hover popup card)
    private bool isInteractive = true;

    /// <summary>Call this on CardViews that should never receive mouse input (e.g. the hover preview).</summary>
    public void SetNonInteractive()
    {
        isInteractive = false;
        // Disable the collider entirely so it can't steal mouse focus
        var col = GetComponent<Collider>();
        if (col != null) col.enabled = false;
    }

    public void Setup(Card card)
    {
        Card = card;
        tittle.text = FormatTMPText(card.Tittle);
        description.text = FormatTMPText(card.Description);
        mana.text = card.Mana.ToString();
        imageSR.sprite = card.Image;
        if (formula != null)
            formula.text = FormatTMPText(card.Formula);
    }

    private string FormatTMPText(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;
        return text.Replace("₂", "<sub>2</sub>")
                   .Replace("₃", "<sub>3</sub>")
                   .Replace("₄", "<sub>4</sub>");
    }

    void OnMouseEnter()
    {
        if (!isInteractive) return;
        if (!Interactions.Instance.PlayerCanHover()) return;
        wrapper.SetActive(false);
        Vector3 pos = new(transform.position.x, -2, 0);
        CardViewHoverSystem.Instance.Show(Card, pos);
    }

    public void SetGlow(bool active)
    {
        if (glowObject == null && active)
            CreateGlowEffect();
        if (glowObject != null)
            glowObject.SetActive(active);
    }

    private void CreateGlowEffect()
    {
        // Find the CardBackground sprite to use as the glow shape
        SpriteRenderer bgSR = wrapper.transform.Find("CardBackground")?.GetComponent<SpriteRenderer>();
        if (bgSR == null) return;

        glowObject = new GameObject("GlowBorder");
        glowObject.transform.SetParent(wrapper.transform, false);
        glowObject.transform.localPosition = new Vector3(0, 0, 0.05f); // behind the card
        glowObject.transform.localScale = new Vector3(1.08f, 1.08f, 1f);

        glowRenderer = glowObject.AddComponent<SpriteRenderer>();
        glowRenderer.sprite = bgSR.sprite;
        glowRenderer.color = new Color(0.3f, 0.6f, 1f, 0.85f); // blue glow
        glowRenderer.sortingLayerID = bgSR.sortingLayerID;
        glowRenderer.sortingOrder = bgSR.sortingOrder - 1; // render behind card

        // Use additive material for the glow bloom look
        glowRenderer.material = new Material(Shader.Find("Sprites/Default"));
        glowRenderer.material.SetFloat("_Mode", 1); // additive-ish

        glowObject.SetActive(false);
    }

    void OnMouseExit()
    {
        if (!isInteractive) return;
        // ALWAYS restore the wrapper so cards never get stuck invisible
        CardViewHoverSystem.Instance.Hide();
        wrapper.SetActive(true);
    }
    void OnMouseDown()
    {
        if (!isInteractive) return;
        if (!Interactions.Instance.PlayerCanInteract()) return;
        if(Card.ManualTargetEffect != null)
        {
            ManualTargetSystem.Instance.StartTargeting(transform.position);


        }
        else
        {
            isBeingDragged = true;
            Interactions.Instance.PlayerIsDragging = true;
            wrapper.SetActive(true);
            CardViewHoverSystem.Instance.Hide();
            dragStartPosition = transform.position;
            dragStartRotation = transform.rotation;
            transform.rotation = Quaternion.Euler(0, 0, 0);
            transform.position = MouseUtil.GetMousePositionInWorldSpace(-1);

            if (CardSystem.Instance != null && CardSystem.Instance.HandView != null)
            {
                List<CardView> validCards = new List<CardView>();
                foreach (var otherCardView in CardSystem.Instance.HandView.Cards)
                {
                    if (otherCardView == null) continue;
                    if (otherCardView != this && RecipeManager.GetCombinedCard(Card.Tittle, otherCardView.Card.Tittle) != null)
                    {
                        validCards.Add(otherCardView);
                    }
                }

                if (validCards.Count > 0)
                {
                    int maxPerRow = 4;
                    float spacingX = 2.0f; 
                    float spacingY = 2.6f; 
                    Vector3 basePos = CardSystem.Instance.HandView.transform.position + new Vector3(0, 3.5f, -1f);

                    for (int i = 0; i < validCards.Count; i++)
                    {
                        if (validCards[i] == null) continue;
                        validCards[i].SetGlow(true);
                        
                        int row = i / maxPerRow;
                        int col = i % maxPerRow;
                        int cardsInThisRow = Mathf.Min(maxPerRow, validCards.Count - row * maxPerRow);
                        
                        float startX = -(cardsInThisRow - 1) * spacingX / 2f;
                        Vector3 targetPos = basePos + new Vector3(startX + col * spacingX, row * spacingY, 0);

                        validCards[i].transform.DOKill();
                        validCards[i].transform.DOMove(targetPos, 0.2f);
                        validCards[i].transform.DORotate(Vector3.zero, 0.2f);
                        validCards[i].transform.DOScale(0.85f, 0.2f);
                    }
                }
            }
        }
    }

    void OnMouseDrag()
    {
         if (!isInteractive) return;
         if (!Interactions.Instance.PlayerCanInteract()) return;
         if(Card.ManualTargetEffect != null) return;
         transform.position = MouseUtil.GetMousePositionInWorldSpace(-1);
    }

    void OnMouseUp()
    {
        if (!isInteractive) return;
        if (!Interactions.Instance.PlayerCanInteract())
        {
            CancelPointerInteraction();
            return;
        }
        if(Card.ManualTargetEffect != null)
        {
            EnemyView target = ManualTargetSystem.Instance.EndTargeting(MouseUtil.GetMousePositionInWorldSpace(-1));
            if(target != null && ManaSystem.Instance.HasEnoughMana(Card.Mana))
            {
                PlayCardGA playCardGA = new(Card, target);
                ActionSystem.Instance.Perform(playCardGA);
            }
        }
        else
        {
            if (CardSystem.Instance != null && CardSystem.Instance.HandView != null)
            {
                foreach (var otherCardView in CardSystem.Instance.HandView.Cards)
                {
                    if (otherCardView == null) continue;
                    otherCardView.SetGlow(false);
                }
                CardSystem.Instance.HandView.RepositionCards(0.2f);
            }

            // Detect card-on-card overlap for fusion
            Collider[] hits = Physics.OverlapSphere(transform.position, 1.5f);
            
            // Sort by closest distance so we don't accidentally combine with a card further away
            var sortedHits = hits.OrderBy(h => Vector3.Distance(transform.position, h.transform.position));

            foreach (var col in sortedHits)
            {
                CardView targetCardView = col.GetComponent<CardView>();
                if (targetCardView != null && targetCardView != this && targetCardView.Card != null)
                {
                    CardData newCardData = RecipeManager.GetCombinedCard(Card.Tittle, targetCardView.Card.Tittle);
                    if (newCardData != null)
                    {
                        CombineCardsGA combineCardsGA = new(Card, targetCardView.Card);
                        ActionSystem.Instance.Perform(combineCardsGA);
                        isBeingDragged = false;
                        Interactions.Instance.PlayerIsDragging = false;
                        return;
                    }
                }
            }

            if (Card.IsPlayable && ManaSystem.Instance.HasEnoughMana(Card.Mana)
            && Physics.Raycast(transform.position, Vector3.forward, out RaycastHit hit, 10f, dropLayer))
            {
                PlayCardGA playCardGA = new(Card);
                ActionSystem.Instance.Perform(playCardGA);
            }
            else
            {
                transform.position = dragStartPosition;
                transform.rotation = dragStartRotation;
            }
            isBeingDragged = false;
            Interactions.Instance.PlayerIsDragging = false; 
        }   
    }

    public void CancelPointerInteraction()
    {
        transform.DOKill();
        if (wrapper != null)
        {
            wrapper.SetActive(true);
        }
        SetGlow(false);
        CardViewHoverSystem.Instance?.Hide();

        if (isBeingDragged)
        {
            transform.position = dragStartPosition;
            transform.rotation = dragStartRotation;
            isBeingDragged = false;
        }

        if (Interactions.Instance != null)
        {
            Interactions.Instance.PlayerIsDragging = false;
        }
    }

    private void OnDisable()
    {
        transform.DOKill();
        if (isBeingDragged && Interactions.Instance != null)
        {
            Interactions.Instance.PlayerIsDragging = false;
        }
    }

    private void OnDestroy()
    {
        transform.DOKill();
    }
}
