using UnityEngine;
using System.Collections.Generic;
using System.Collections;
using DG.Tweening;


public class EnemyBoardView : MonoBehaviour
{
    [SerializeField] private List<Transform> slots;

    public List<EnemyView> EnemyViews { get; private set; } = new();

    public void AddEnemy(EnemyData enemyData)
    {
        Transform slot = slots[EnemyViews.Count];
        EnemyView enemyView = EnemyViewCreator.Instance.CreateEnemyView(enemyData, slot.position, slot.rotation);
        enemyView.transform.parent = slot;
        EnemyViews.Add(enemyView);
        
    }
    public IEnumerator RemoveEnemy(EnemyView enemyView)
    {
        if (enemyView == null) yield break;

        EnemyViews.Remove(enemyView);
        enemyView.transform.DOKill();
        Tween tween = enemyView.transform.DOScale(Vector3.zero, 0.25f);
        yield return tween.WaitForCompletion();
        enemyView.transform.DOKill();
        Destroy(enemyView.gameObject);
    }
}
