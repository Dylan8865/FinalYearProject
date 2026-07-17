using System;
using System.Collections.Generic;
using UnityEngine;

public static class RecipeManager
{
    [Serializable]
    public struct RecipeDefinition
    {
        public string ElementA;
        public string ElementB;
        public string CompoundName;

        public RecipeDefinition(string elementA, string elementB, string compoundName)
        {
            ElementA = elementA;
            ElementB = elementB;
            CompoundName = compoundName;
        }
    }

    private static readonly IReadOnlyList<RecipeDefinition> recipes = new[]
    {
        new RecipeDefinition("Al", "O", "Aluminium Oxide"),
        new RecipeDefinition("Fe", "O", "Iron(III) Oxide"),
        new RecipeDefinition("Na", "Cl", "Sodium Chloride"),
        new RecipeDefinition("Mg", "O", "Magnesium Oxide"),
        new RecipeDefinition("H", "O", "Water"),
        new RecipeDefinition("C", "O", "Carbon Dioxide"),
        new RecipeDefinition("N", "H", "Ammonia"),
        new RecipeDefinition("H", "Cl", "Hydrogen Chloride"),
        new RecipeDefinition("C", "H", "Methane")
    };

    public static IReadOnlyList<RecipeDefinition> Recipes => recipes;

    public static CardData GetCombinedCard(string nameA, string nameB)
    {
        string combinedName = GetCombinedCardName(nameA, nameB);
        if (combinedName == null) return null;

        // Try to load the combined card from Resources
        // The user must place their combined cards in a Resources/Cards folder
        CardData combinedData = Resources.Load<CardData>("Cards/" + combinedName);
        if (combinedData == null)
        {
            Debug.LogError($"Recipe found for {combinedName}, but could not find the CardData in Resources/Cards folder!");
        }
        return combinedData;
    }

    private static string GetCombinedCardName(string nameA, string nameB)
    {
        for (int i = 0; i < recipes.Count; i++)
        {
            RecipeDefinition recipe = recipes[i];
            bool directMatch = nameA == recipe.ElementA && nameB == recipe.ElementB;
            bool reverseMatch = nameA == recipe.ElementB && nameB == recipe.ElementA;
            if (directMatch || reverseMatch)
            {
                return recipe.CompoundName;
            }
        }

        return null;
    }
}
