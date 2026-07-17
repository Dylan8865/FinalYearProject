using UnityEngine;

public class ApplySuffocateGA : GameAction
{
    public int SuffocateDamage { get; private set; }

    public CombatantView Target { get; private set; }

    public ApplySuffocateGA(int suffocateDamage, CombatantView target)
    {
        SuffocateDamage = suffocateDamage;
        Target = target;
    }
}
