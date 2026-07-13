# AI Agent Prompt: In-Game UI Implementation

**@workspace**

I need to implement two new UI features in my Unity 2D Chemistry Card Battler game. I have attached 3 reference images:

- `image 3` shows my main gameplay screen. I want to add two HUD buttons in the top corners (marked by red circles).
- `image 2` shows the exact layout for the Pause Menu.
- `image 1` shows the exact layout for the Options Menu.

Please generate the C# scripts and provide step-by-step instructions for setting up the Unity UI (Canvas, Panels, Buttons) for the following to-do list:

## Task 1: Pause & Options Menu (Top-Left)

1. **HUD Button:** Create a logic flow for a "Gear/Pause" button anchored to the top-left of the main Canvas.
2. **Pause Menu Panel:**
   - When the top-left button is clicked, the game must pause (`Time.timeScale = 0`).
   - Show a panel matching `image 2` with a wooden background and 4 buttons: **PLAY** (Resumes game), **RESTART** (Reloads current scene), **OPTIONS** (Opens Options Panel), and **QUIT** (Returns to Main Menu or quits application).
3. **Options Menu Panel:**
   - When "OPTIONS" is clicked on the Pause Menu, hide the Pause Menu and show the Options Panel matching `image 1`.
   - It needs two Sliders: **MUSIC** and **SOUND**.
   - Please provide the C# logic to connect these sliders to a Unity `AudioMixer` so they actually control the game's volume.
   - Include a "Close (X)" button at the bottom to return to the Pause Menu.

## Task 2: Compound Recipe Book (Top-Right)

1. **HUD Button:** Create a logic flow for a "Book" button anchored to the top-right of the main Canvas.
2. **Recipe Panel UI:**
   - When clicked, this should open a large "Recipe Book" panel overlay.
   - It needs a Unity `ScrollRect` (ScrollView) to handle a potentially long list of recipes.
3. **Data Binding (Logic):**
   - Based on my existing compound data, write a script (e.g., `RecipeBookManager.cs`) that dynamically spawns a "Recipe Row Prefab" for every valid compound.
   - Each row should display: Base Element 1 + Base Element 2 = Compound Name. (Keep in mind my game uses a simplified 1:1 ratio for combinations).
   - Include a "Close (X)" button to hide the book and resume the game.
4. **Tutorials:**
   * It triggers on-screen tips for a specific item or screen.
   * teach user how to play my game refer image 4
   * user can press arrow button to next page, below got bubble.
