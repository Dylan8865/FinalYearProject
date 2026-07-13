using UnityEngine;

public class DrawCardsGA : GameAction
{
    public int Amount { get; set; }

    public bool RespectMaxHandSize { get; set; }

    public DrawCardsGA(int amount, bool respectMaxHandSize = true)
    {
        Amount = amount;
        RespectMaxHandSize = respectMaxHandSize;
    }
    
}
