using UnityEngine;

[CreateAssetMenu(menuName ="Data/Enemy")]
public class EnemyData : ScriptableObject
{
    [field: SerializeField] public Sprite Image { get; private set; }

    [field: SerializeField] public GameObject ModelPrefab { get; private set; }

    [field: SerializeField] public Material ModelMaterial { get; private set; }

    [field: SerializeField] public Vector3 ModelLocalPosition { get; private set; }

    [field: SerializeField] public Vector3 ModelLocalEulerAngles { get; private set; } = new Vector3(0f, 180f, 0f);

    [field: SerializeField] public Vector3 ModelLocalScale { get; private set; } = Vector3.one * 1.5f;

    [field: SerializeField] public int Health { get; private set; }

    [field: SerializeField] public int AttackPower { get; private set;}
}
