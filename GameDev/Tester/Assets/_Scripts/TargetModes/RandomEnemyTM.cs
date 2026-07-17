using UnityEngine;
using System.Collections.Generic;


public class RandomEnemyTM : TargetMode
{
    public override List<CombatantView> GetTargets()
    {
        CombatantView target = EnemySystem.Instance.Enemies[Random.Range(0, EnemySystem.Instance.Enemies.Count)];
        return new() { target};
    }
}
