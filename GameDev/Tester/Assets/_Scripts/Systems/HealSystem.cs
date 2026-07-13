using System.Collections;
using UnityEngine;

public class HealSystem : MonoBehaviour
{
    [SerializeField] private GameObject healVFX;

    void OnEnable()
    {
        ActionSystem.AttachPerformer<HealGA>(HealPerformer);
    }

    void OnDisable()
    {
        ActionSystem.DetachPerformer<HealGA>();
    }

    private IEnumerator HealPerformer(HealGA healGA)
    {
        foreach (var target in healGA.Targets)
        {
            target.Heal(healGA.Amount);
            AudioManager.Instance?.PlayHealSound();
            if (healVFX != null)
            {
                Instantiate(healVFX, target.transform.position, Quaternion.identity);
            }
            yield return new WaitForSeconds(0.15f);
        }
    }
}
