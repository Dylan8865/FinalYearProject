using UnityEngine;
using TMPro;

public class HeroView : CombatantView
{
    [SerializeField] private TMP_Text attackText;

    public int AttackBonus { get; private set; }

    public void Setup(HeroData heroData)
    {
        AttackBonus = 0;
        BindAttackText();
        UpdateAttackText();
        SetupBase(heroData.Health, heroData.Image);
    }

    public void AddAttackBonus(int amount)
    {
        AttackBonus += Mathf.Max(0, amount);
        UpdateAttackText();
    }

    private void BindAttackText()
    {
        attackText = null;
        TMP_Text[] labels = GetComponentsInChildren<TMP_Text>(true);
        for (int i = 0; i < labels.Length; i++)
        {
            if (labels[i].name == "AttackText")
            {
                attackText = labels[i];
                break;
            }
        }
    }

    private void UpdateAttackText()
    {
        if (attackText != null)
        {
            attackText.text = "ATK: " + AttackBonus;
        }
    }
}
