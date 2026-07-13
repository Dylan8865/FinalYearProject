using UnityEngine;
using System.Collections.Generic;

public class HealEffect : Effect
{
    [SerializeField] private int healAmount;

    public override GameAction GetGameAction(List<CombatantView> targets, CombatantView caster)
    {
        HealGA healGA = new(healAmount, targets, caster);
        return healGA;
    }
}
