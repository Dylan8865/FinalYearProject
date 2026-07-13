# Basic Two-Element Combinations (SPM Form 4 Syllabus)

In the Malaysian Form 4 Chemistry syllabus, two-element combinations (binary compounds) are taught in two main categories: **Ionic Bonds** (Metal + Non-Metal) and **Covalent Bonds** (Non-Metal + Non-Metal).

Here are the most fundamental combinations you should include in your game's `Elements`, `Compounds`, and `Compound_Recipes` database tables:

## 1. Ionic Combinations (Metal + Non-Metal)

These occur when a metal element donates electrons to a non-metal element. In a game context, these could act as "Shield" or "Earth/Crystal" type abilities.

- **Sodium Chloride (Garam / Salt)**

  - **Elements:** Sodium (Na) + Chlorine (Cl)
  - **Formula:** NaCl
  - **Game Recipe Idea:** 1x Na + 1x Cl
- **Magnesium Oxide (Magnesium Oksida)**

  - **Elements:** Magnesium (Mg) + Oxygen (O)
  - **Formula:** MgO
  - **Game Recipe Idea:** 1x Mg + 1x O
- **Aluminium Oxide (Aluminium Oksida)**

  - **Elements:** Aluminium (Al) + Oxygen (O)
  - **Formula:** Al₂O₃
  - **Game Recipe Idea:** 2x Al + 3x O
- **Iron(III) Oxide (Karat / Rust)**

  - **Elements:** Iron (Fe) + Oxygen (O)
  - **Formula:** Fe₂O₃
  - **Game Recipe Idea:** 2x Fe + 3x O

## 2. Covalent Combinations (Non-Metal + Non-Metal)

These occur when two non-metal elements share electrons. In a game context, these often make great "Liquid", "Gas", or "Energy" type abilities.

- **Water (Air)**

  - **Elements:** Hydrogen (H) + Oxygen (O)
  - **Formula:** H₂O
  - **Game Recipe Idea:** 2x H + 1x O (Great for a "Heal" effect!)
- **Carbon Dioxide (Karbon Dioksida)**

  - **Elements:** Carbon (C) + Oxygen (O)
  - **Formula:** CO₂
  - **Game Recipe Idea:** 1x C + 2x O (Could be a "Suffocate/Poison" debuff)
- **Ammonia**

  - **Elements:** Nitrogen (N) + Hydrogen (H)
  - **Formula:** NH₃
  - **Game Recipe Idea:** 1x N + 3x H
- **Hydrogen Chloride (Asid Hidroklorik)**

  - **Elements:** Hydrogen (H) + Chlorine (Cl)
  - **Formula:** HCl
  - **Game Recipe Idea:** 1x H + 1x Cl (Perfect for high "Damage/Attack" effect)
- **Methane (Metana)**

  - **Elements:** Carbon (C) + Hydrogen (H)
  - **Formula:** CH₄
  - **Game Recipe Idea:** 1x C + 4x H (Could be a "Fire/Explosion" attack)

## 💡 How to map this to your FYP Database

If a student selects the **Na** card and the **Cl** card in your game UI, your `GameEngineAPI` will check the `CompoundRecipe` table. It will find a match, consume those elements, and output the **NaCl** `Compound` object, triggering its specific `base_effect_value`!

1. Base Elements (The Playing Cards)
   These are the 9 fundamental elements populated in your Elements table:

Na (Sodium) – Alkali Metal

Cl (Chlorine) – Halogen

Mg (Magnesium) – Alkaline Earth

O (Oxygen) – Non-Metal

Al (Aluminium) – Post-Transition Metal

Fe (Iron) – Transition Metal

H (Hydrogen) – Non-Metal

C (Carbon) – Non-Metal

N (Nitrogen) – Non-Metal

2. Ionic Compounds & Recipes (Metal + Non-Metal)
   These are the defensive/earth-based combinations:

Sodium Chloride (NaCl)

Recipe: 1 Na + 1 Cl

Effect: Shield (Base Value: 10)

Magnesium Oxide (MgO)

Recipe: 1 Mg + 1 O

Effect: Shield (Base Value: 15)

Aluminium Oxide (Al2O3)

Recipe: 2 Al + 3 O

Effect: Shield (Base Value: 20)

Iron(III) Oxide (Fe2O3)

Recipe: 2 Fe + 3 O

Effect: Earth (Base Value: 15) | Status Effect: Poison

3. Covalent Compounds & Recipes (Non-Metal + Non-Metal)
   These are your spell-like abilities, heals, and heavy attacks:

Water (H2O)

Recipe: 2 H + 1 O

Effect: Heal (Base Value: 20) | Status Effect: Cleanse

Carbon Dioxide (CO2)

Recipe: 1 C + 2 O

Effect: Debuff (Base Value: 10) | Status Effect: Suffocate

Ammonia (NH3)

Recipe: 1 N + 3 H

Effect: Poison (Base Value: 15) | Status Effect: Toxic Gas

Hydrogen Chloride (HCl)

Recipe: 1 H + 1 Cl

Effect: Attack (Base Value: 25) | Status Effect: Acid Burn

Methane (CH4)

Recipe: 1 C + 4 H

Effect: Attack (Base Value: 30) | Status Effect: Explosion
