using UnityEngine;
using System.Collections;

public class EffectSystem : MonoBehaviour
{

    void OnEnable()
    {
        ActionSystem.AttachPerformer<PerformEffectGA>(PerformEffectPerformer);

    }
    void OnDisable()
    {
        ActionSystem.DetachPerformer<PerformEffectGA>();

    }

    // Performers
    private IEnumerator PerformEffectPerformer(PerformEffectGA performEffectGA)
    {
        if (performEffectGA.Effect != null)
        {
            GameAction effectAction = performEffectGA.Effect.GetGameAction(performEffectGA.Targets, HeroSystem.Instance.HeroView);
            if (effectAction != null)
            {
                ActionSystem.Instance.AddReaction(effectAction);
            }
        }
        yield return null;
        
    }


}
