using UnityEngine;
using System.Collections;


public class StatusEffectSystem : MonoBehaviour
{
    private void OnEnable()
    {
        ActionSystem.AttachPerformer<AddStatusEffectGA>(AddStatusEffectPerformer);
    }

    private void OnDisable()
    {
        ActionSystem.DetachPerformer<AddStatusEffectGA>();
    }

    private IEnumerator AddStatusEffectPerformer(AddStatusEffectGA addStatusEffectGA)
    {
        foreach (var target in addStatusEffectGA.Targets)
        {
            target.AddStatusEffect(addStatusEffectGA.StatusEffectType, addStatusEffectGA.StackCount);
            if (addStatusEffectGA.StatusEffectType == StatusEffectType.ARMOR)
            {
                AudioManager.Instance?.PlayDefenseSound();
            }
            yield return null; // ADD VFX for adding status effects
        }

    }
}
