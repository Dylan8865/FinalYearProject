using UnityEngine;
using System;
using System.Collections.Generic;

[Serializable]
public struct CardDropRate
{
    public CardData CardData;
    public int Weight;
}

[CreateAssetMenu(menuName = "Data/Hero")]
public class HeroData : ScriptableObject
{
    [field: SerializeField] public Sprite Image { get; private set; }

    [field: SerializeField] public int Health { get; private set; }

    [field: SerializeField] public List<CardDropRate> DropTable { get; private set;}
}
