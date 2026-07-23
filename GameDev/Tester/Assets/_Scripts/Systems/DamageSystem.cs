using System.Collections;
using UnityEngine;


public class DamageSystem : MonoBehaviour
{
    [SerializeField] private GameObject damageVFX;

    void OnEnable()
    {
        ActionSystem.AttachPerformer<DealDamageGA>(DealDamagePerformer);
    }

    void OnDisable()
    {
        ActionSystem.DetachPerformer<DealDamageGA>();
    }

    private IEnumerator DealDamagePerformer(DealDamageGA dealDamageGA)
    {
        int damageAmount = dealDamageGA.Amount;
        if (!dealDamageGA.IgnoresAttackBonus && dealDamageGA.Caster is HeroView hero)
        {
            damageAmount += hero.AttackBonus;
        }

        foreach (var target in new System.Collections.Generic.List<CombatantView>(dealDamageGA.Targets))
        {
            if (target == null) continue;

            target.Damage(damageAmount);
            if (target is EnemyView)
            {
                AudioManager.Instance?.PlaySwordSound();
            }
            Instantiate(damageVFX, target.transform.position, Quaternion.identity);
            yield return new WaitForSeconds(0.15f);
            if (target.CurrentHealth <= 0)
            {
                if (target is EnemyView enemyView)
                {
                    KillEnemyGA killEnemyGA = new(enemyView);
                    ActionSystem.Instance.AddReaction(killEnemyGA);
                }
                else
                {
                    RunProgressionSystem progression = RunProgressionSystem.Instance;
                    GameSessionReporter.Instance?.ReportMatchCompleted(
                        "enemy",
                        progression != null ? progression.TurnsUsed : 0,
                        progression != null ? progression.Score : 0,
                        progression != null ? progression.WavesCleared : 0,
                        false,
                        progression != null ? progression.EnemiesDefeated : 0,
                        progression != null ? progression.CompoundsDiscovered : 0,
                        progression != null ? progression.HighestCombo : 0);
                    if (UIManager.Instance != null)
                    {
                        UIManager.Instance.ShowUI<GameOverUI>("GameOverUI");
                    }
                }

                
            }
        }
    }
}
