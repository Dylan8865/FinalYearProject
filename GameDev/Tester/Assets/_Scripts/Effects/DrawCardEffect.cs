using UnityEngine;
using System.Collections.Generic;

[System.Serializable]
public class DrawCardEffect : Effect
{
    [SerializeField] private int drawAmount;
    
    public override GameAction GetGameAction(List<CombatantView> targets, CombatantView caster)
    {
        DrawCardsGA drawCardsGA = new(drawAmount, false);
        return drawCardsGA;
    }
}
