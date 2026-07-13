using UnityEngine;

public class Interactions : Singleton<Interactions>
{
    public bool PlayerIsDragging { get; set; } = false;

    public bool PlayerCanInteract()
    {
        if (Time.timeScale <= 0f) return false;
        if (ActionSystem.Instance == null) return false;
        return !ActionSystem.Instance.IsPerforming;
    }
    public bool PlayerCanHover()
    {
        if (!PlayerCanInteract()) return false;
        if (PlayerIsDragging) return false;
        return true;
    }
}
