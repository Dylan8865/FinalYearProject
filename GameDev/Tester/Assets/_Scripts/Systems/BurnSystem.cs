using UnityEngine;
using System.Collections;

public class BurnSystem : MonoBehaviour
{
    [SerializeField] private GameObject burnVFX;

    private void OnEnable()
    {
        ActionSystem.AttachPerformer<ApplyBurnGA>(ApplyBurnPerformer);
    }

    private void OnDisable()
    {
        ActionSystem.DetachPerformer<ApplyBurnGA>();
    }

    private IEnumerator ApplyBurnPerformer(ApplyBurnGA applyBurnGA)
    {
        CombatantView target = applyBurnGA.Target;
        if (target == null) yield break;

        Instantiate(burnVFX, target.transform.position, Quaternion.identity);
        int damage = applyBurnGA.BurnDamage;
        if (target is EnemyView && HeroSystem.Instance != null && HeroSystem.Instance.HeroView != null)
        {
            damage += HeroSystem.Instance.HeroView.AttackBonus;
        }
        target.Damage(damage);
        if (target == null) yield break;

        target.RemoveStatusEffect(StatusEffectType.BURN, 1);
        if (target.CurrentHealth <= 0 && target is EnemyView enemy)
        {
            ActionSystem.Instance.AddReaction(new KillEnemyGA(enemy));
        }
        yield return new WaitForSeconds(1f);
    }
}
