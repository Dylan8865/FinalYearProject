using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using DG.Tweening;



public class EnemySystem : Singleton<EnemySystem>
{
    [SerializeField] private EnemyBoardView enemyBoardView;

    public List<EnemyView> Enemies => enemyBoardView.EnemyViews;
    
    private List<EnemyWave> waves;
    private int currentWaveIndex = 0;

    void OnEnable()
    {
        ActionSystem.AttachPerformer<EnemyTurnGA>(EnemyTurnPerformer);
        ActionSystem.AttachPerformer<AttackHeroGA>(AttackHeroPerformer);
        ActionSystem.AttachPerformer<KillEnemyGA>(KillEnemyPerformer);
    }
    void OnDisable()
    {
        ActionSystem.DetachPerformer<EnemyTurnGA>();
        ActionSystem.DetachPerformer<AttackHeroGA>();
        ActionSystem.DetachPerformer<KillEnemyGA>();
    }
    // Performers

    public void Setup(List<EnemyWave> enemyWaves)
    {
        waves = enemyWaves;
        currentWaveIndex = 0;
        SpawnCurrentWave();
    }

    private void SpawnCurrentWave()
    {
        if (waves == null || currentWaveIndex >= waves.Count) return;
        
        foreach (var enemyData in waves[currentWaveIndex].Enemies)
        {
            enemyBoardView.AddEnemy(enemyData);
        }
    }

    private IEnumerator EnemyTurnPerformer(EnemyTurnGA enemyTurnGA)
    {
        List<EnemyView> enemiesAtTurnStart = new(enemyBoardView.EnemyViews);
        foreach(var enemy in enemiesAtTurnStart)
        {
            if (enemy == null || !enemyBoardView.EnemyViews.Contains(enemy)) continue;

            int burnStacks = enemy.GetStatusEffectStacks(StatusEffectType.BURN);
            if(burnStacks > 0)
            {
                ApplyBurnGA applyBurnGA = new(burnStacks, enemy);
                ActionSystem.Instance.AddReaction(applyBurnGA);
            }

            int suffocateStacks = enemy.GetStatusEffectStacks(StatusEffectType.SUFFOCATE);
            if(suffocateStacks > 0)
            {
                ApplySuffocateGA applySuffocateGA = new(suffocateStacks, enemy);
                ActionSystem.Instance.AddReaction(applySuffocateGA);
            }

            AttackHeroGA attackHeroGA = new(enemy);
            ActionSystem.Instance.AddReaction(attackHeroGA);
        }
        yield return null;
        
    }

    private IEnumerator AttackHeroPerformer(AttackHeroGA attackHeroGA)
    {
        EnemyView attacker = attackHeroGA.Attacker;
        if (attacker == null || !enemyBoardView.EnemyViews.Contains(attacker)) yield break;

        attacker.transform.DOKill();
        Tween tween = attacker.transform.DOMoveX(attacker.transform.position.x - 1f, 0.15f);
        yield return tween.WaitForCompletion();
        if (attacker == null || !enemyBoardView.EnemyViews.Contains(attacker)) yield break;

        attacker.transform.DOMoveX(attacker.transform.position.x + 1f, 0.25f);
        //Deal damage
        DealDamageGA dealDamageGA = new(attacker.AttackPower, new(){HeroSystem.Instance.HeroView}, attackHeroGA.Caster);
        ActionSystem.Instance.AddReaction(dealDamageGA);
    }
    private IEnumerator KillEnemyPerformer(KillEnemyGA killEnemyGA)
    {
        if (killEnemyGA.EnemyView == null || !Enemies.Contains(killEnemyGA.EnemyView))
        {
            yield break;
        }

        RunProgressionSystem.Instance?.RegisterEnemyDefeated();
        yield return enemyBoardView.RemoveEnemy(killEnemyGA.EnemyView);
        if (Enemies.Count == 0)
        {
            currentWaveIndex++;
            if (currentWaveIndex < waves.Count)
            {
                if (RunProgressionSystem.Instance != null)
                {
                    RunProgressionSystem.Instance.CompleteCurrentWave(SpawnCurrentWave);
                }
                else
                {
                    SpawnCurrentWave();
                }
            }
            else
            {
                if (RunProgressionSystem.Instance != null)
                {
                    RunProgressionSystem.Instance.CompleteCurrentWave(null);
                }
                else
                {
                    Debug.Log("All waves defeated! You win!");
                }
            }
        }
    }
   
}
