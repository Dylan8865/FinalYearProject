using System.Collections.Generic;
using UnityEngine;

public class DealDamageGA : GameAction, IHaveCaster
{
    public int Amount { get; set; }

    public List<CombatantView> Targets { get; set; }

    public CombatantView Caster { get; private set; }

    public bool IgnoresAttackBonus { get; set; }

    public DealDamageGA(int amount, List<CombatantView> targets, CombatantView caster, bool ignoresAttackBonus = false)
    {
        Amount = amount;
        Targets = new(targets);
        Caster = caster;
        IgnoresAttackBonus = ignoresAttackBonus;
    }
    
}
