using UnityEngine;
using System.Collections.Generic;


public class Card 
{
    public string Tittle => data.name;
    
    public string Description => data.Description;

    public Sprite Image => data.Image;

    public string Formula => data.Formula;

    public Effect ManualTargetEffect => data.ManualTargetEffect;

    public List<AutoTargetEffect> OtherEffects => data.OtherEffects;

    public bool IsPlayable => ManualTargetEffect != null || (OtherEffects != null && OtherEffects.Count > 0);

    public int Mana { get; private set; }

    private readonly CardData data;
    public Card(CardData cardData)
    {
        data = cardData;
        Mana = cardData.Mana;
    }

}
