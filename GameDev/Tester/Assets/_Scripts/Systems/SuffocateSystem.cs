using UnityEngine;
using System.Collections;

public class SuffocateSystem : MonoBehaviour
{
    [SerializeField] private GameObject suffocateVFX;

    private void OnEnable()
    {
        ActionSystem.AttachPerformer<ApplySuffocateGA>(ApplySuffocatePerformer);
    }

    private void OnDisable()
    {
        ActionSystem.DetachPerformer<ApplySuffocateGA>();
    }

    private IEnumerator ApplySuffocatePerformer(ApplySuffocateGA applySuffocateGA)
    {
        CombatantView target = applySuffocateGA.Target;
        if (target == null) yield break;

        Instantiate(suffocateVFX, target.transform.position, Quaternion.identity);
        int damage = applySuffocateGA.SuffocateDamage;
        if (target is EnemyView && HeroSystem.Instance != null && HeroSystem.Instance.HeroView != null)
        {
            damage += HeroSystem.Instance.HeroView.AttackBonus;
        }
        target.Damage(damage);
        if (target == null) yield break;

        target.RemoveStatusEffect(StatusEffectType.SUFFOCATE, 1);
        if (target.CurrentHealth <= 0 && target is EnemyView enemy)
        {
            ActionSystem.Instance.AddReaction(new KillEnemyGA(enemy));
        }
        yield return new WaitForSeconds(1f);
    }
}
