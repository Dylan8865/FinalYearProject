using System.Collections.Generic;
using UnityEngine;

public class HealGA : GameAction, IHaveCaster
{
    public int Amount { get; set; }

    public List<CombatantView> Targets { get; set; }

    public CombatantView Caster { get; private set; }

    public HealGA(int amount, List<CombatantView> targets, CombatantView caster)
    {
        Amount = amount;
        Targets = new(targets);
        Caster = caster;
    }
}
