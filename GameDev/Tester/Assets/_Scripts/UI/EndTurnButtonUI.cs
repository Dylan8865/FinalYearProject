using UnityEngine;

public class EndTurnButtonUI : MonoBehaviour
{
    public void OnClick()
    {
        if (Interactions.Instance == null || !Interactions.Instance.PlayerCanInteract())
        {
            return;
        }

        RunProgressionSystem.Instance?.RegisterTurnEnded();
        EnemyTurnGA enemyTurnGA = new();
        ActionSystem.Instance.Perform(enemyTurnGA);
    }

}
