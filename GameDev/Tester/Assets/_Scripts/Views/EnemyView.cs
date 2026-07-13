using UnityEngine;
using TMPro;

public class EnemyView : CombatantView
{
    [SerializeField] private TMP_Text attackText;

    public int AttackPower { get; set; }

    public void Setup(EnemyData enemyData)
    {
        AttackPower = enemyData.AttackPower;
        BindAttackText();
        UpdateAttackText();
        SetupBase(enemyData.Health, enemyData.Image);
        SetupModel(enemyData);
    }

    private void BindAttackText()
    {
        attackText = null;
        TMP_Text[] labels = GetComponentsInChildren<TMP_Text>(true);
        for (int i = 0; i < labels.Length; i++)
        {
            if (labels[i].name == "AttackText" && labels[i].transform.parent == transform)
            {
                attackText = labels[i];
                break;
            }
        }

        if (attackText == null)
        {
            for (int i = 0; i < labels.Length; i++)
            {
                if (labels[i].name == "AttackText")
                {
                    attackText = labels[i];
                    break;
                }
            }
        }

        for (int i = 0; i < labels.Length; i++)
        {
            if (labels[i].name == "AttackText" && labels[i] != attackText)
            {
                labels[i].gameObject.SetActive(false);
            }
        }
    }

    private void UpdateAttackText()
    {
        if (attackText != null)
        {
            attackText.text = "ATK: " + AttackPower;
        }
    }

    private void SetupModel(EnemyData enemyData)
    {
        if (enemyData.ModelPrefab == null)
        {
            return;
        }

        GameObject model = Instantiate(enemyData.ModelPrefab, transform);
        model.name = "EnemyModel";
        model.transform.localPosition = enemyData.ModelLocalPosition;
        model.transform.localRotation = Quaternion.Euler(enemyData.ModelLocalEulerAngles);
        model.transform.localScale = enemyData.ModelLocalScale;

        if (enemyData.ModelMaterial != null)
        {
            Renderer[] renderers = model.GetComponentsInChildren<Renderer>(true);
            foreach (Renderer modelRenderer in renderers)
            {
                modelRenderer.sharedMaterial = enemyData.ModelMaterial;
            }
        }
    }
}
