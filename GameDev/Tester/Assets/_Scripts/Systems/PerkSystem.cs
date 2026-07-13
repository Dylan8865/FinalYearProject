using UnityEngine;
using System.Collections.Generic;

public class PerkSystem : Singleton<PerkSystem>
{
    [SerializeField] private PerksUI perksUI;

    private readonly List<Perk> perks = new();

    public void AddPerk(Perk perk)
    {
        perks.Add(perk);
        perksUI.AddPerkUI(perk);
        perk.OnAdd();
    }

    public void RemovePerk(Perk perk)
    {
        perks.Remove(perk);
        if (perksUI != null)
        {
            perksUI.RemovePerkUI(perk);
        }
        perk.OnRemove();
    }

    public void ClearPerks()
    {
        for (int i = perks.Count - 1; i >= 0; i--)
        {
            RemovePerk(perks[i]);
        }
    }

    private void OnDestroy()
    {
        ClearPerks();
    }
}
