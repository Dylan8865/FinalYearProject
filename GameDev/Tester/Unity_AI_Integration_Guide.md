# 🤖 AI Execution Guide: Unity UI & Audio Integration

## ⚠️ SYSTEM DIRECTIVE FOR AI ASSISTANTS
**CRITICAL INSTRUCTION:** When executing the tasks below, you MUST strictly reference the file paths provided from the `cardGame_file_list.txt` repository. Do not invent file paths. All instantiated GameObjects, Prefabs, Sprites, Fonts, and AudioClips must be loaded from these exact directories.

---

## 1. 🖥️ Start UI Generation (Derived from `LoginUI`)

### Target Asset Path:
* `Assets/Resources/UI/LoginUI.prefab`

### Execution Steps:
1. **Instantiate & Unpack:** Load `Assets/Resources/UI/LoginUI.prefab` into the active scene's Canvas. Right-click and select "Unpack Prefab Completely".
2. **Rename:** Rename the instantiated root GameObject from `LoginUI` to `StartUI`.
3. **UI Modification:**
   * Locate the input fields (e.g., Username/Password) within the hierarchy and `Destroy` or disable them (`SetActive(false)`).
   * Locate the main submit button. Change its Text component to say **"Start Game"**.
   * *Font Reference:* If the font is missing, apply `Assets/Font/_TitleButton.ttf` or `Assets/Font/cuyuan.ttf` to the Text component.
4. **Script Attachment:** Create a new script `StartMenuController.cs`.
   * Attach it to the `StartUI` GameObject.
   * Create a public method `public void StartGame() { UnityEngine.SceneManagement.SceneManager.LoadScene("GameSceneName"); }`
   * Bind this method to the "Start Game" Button's `OnClick()` event via the Unity Inspector.

---

## 2. 🎵 Audio System Integration

### Target Asset Paths:
* **BGM:** `Assets/Resources/Sounds/BGM/bgm1.mp3` or `Assets/Resources/Sounds/BGM/battle.wav`
* **SFX (Game Over):** `Assets/Resources/Sounds/Effect/lose.wav`
* **SFX (UI Clicks):** `Assets/Resources/Sounds/Cards/cardPlace.wav` (Can be repurposed for button clicks)

### Execution Steps:
1. **AudioManager Creation:** Create an empty GameObject named `AudioManager` and attach a new script `AudioManager.cs`. Mark it with `DontDestroyOnLoad`.
2. **AudioSources:** Add two `AudioSource` components to `AudioManager`:
   * `AudioSource bgmSource`: Set `loop = true`. Assign `Assets/Resources/Sounds/BGM/bgm1.mp3` to the AudioClip. Set `PlayOnAwake = true`.
   * `AudioSource sfxSource`: Set `loop = false`.
3. **Script Logic:** In `AudioManager.cs`, create public methods:
   * `PlayClickSound()` -> plays `cardPlace.wav`.
   * `PlayLoseSound()` -> plays `lose.wav`.

---

## 3. 💀 Game Over Board & Retry Button

### Target Asset Paths:
* **Board Background:** `Assets/Arts/gui/UI/EndBattlePopup.png` (or `Assets/Arts/gui/UI/EndBattleElement.png`)
* **Retry Button Sprite:** `Assets/Arts/gui/UI/Button.png`
* **Font:** `Assets/Font/_Content.ttf`

### Execution Steps:
1. **Create UI Panel:** Under the main Canvas, create a new UI Panel named `GameOverBoard`. Set its active state to `false` by default.
2. **Apply Background:** Assign `Assets/Arts/gui/UI/EndBattlePopup.png` as the Source Image of the `GameOverBoard` Image component.
3. **Add Text:** Add a UI Text element as a child. Set text to "GAME OVER", color to Red, and font to `Assets/Font/_TitleButton.ttf`.
4. **Create Retry Button:** * Add a UI Button child to `GameOverBoard`. 
   * Apply `Assets/Arts/gui/UI/Button.png` as the button graphic.
   * Set its Text to "Retry".
5. **GameManager Link:** * In your `GameManager.cs`, create a reference: `public GameObject gameOverBoard;`
   * On player death, call `gameOverBoard.SetActive(true);` and `AudioManager.instance.PlayLoseSound();`
   * Bind the Retry Button's `OnClick()` to a method: `public void RestartGame() { SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex); }`.

---

## 4. 🔇 BGM Mute Settings

### Target Asset Paths:
* **Checkbox/Toggle UI:** `Assets/Arts/gui2/UI/Elements/Checkmark.png`
* **Button Background:** `Assets/Arts/gui2/UI/Elements/Button.png`

### Execution Steps:
1. **Create Mute Button:** On the `StartUI` and `GameOverBoard`, add a UI Toggle or UI Button named `MuteBGM_Toggle`.
2. **Visuals:** Use `Assets/Arts/gui2/UI/Elements/Button.png` for the background and `Assets/Arts/gui2/UI/Elements/Checkmark.png` for the toggle graphic.
3. **Scripting the Mute Logic:**
   * In `AudioManager.cs`, add:
     ```csharp
     public void ToggleMute() 
     {
         bgmSource.mute = !bgmSource.mute;
         PlayerPrefs.SetInt("IsMuted", bgmSource.mute ? 1 : 0);
     }
     ```
   * Add a `Start()` method to load the preference:
     ```csharp
     void Start() 
     {
         bgmSource.mute = PlayerPrefs.GetInt("IsMuted", 0) == 1;
     }
     ```
4. **Event Binding:** Link the `MuteBGM_Toggle` OnValueChanged/OnClick event to the `AudioManager.ToggleMute()` function.
