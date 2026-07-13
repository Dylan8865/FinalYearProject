using UnityEngine;

public class CombineCardsGA : GameAction
{
    public Card CardA { get; private set; }
    public Card CardB { get; private set; }

    public CombineCardsGA(Card cardA, Card cardB)
    {
        CardA = cardA;
        CardB = cardB;
    }
}
