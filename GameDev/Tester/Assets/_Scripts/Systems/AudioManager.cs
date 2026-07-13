using UnityEngine;
using System.Collections.Generic;

public class AudioManager : MonoBehaviour
{
    private const string MutePreferenceKey = "IsMuted";
    private const string SfxMutePreferenceKey = "IsSfxMuted";
    private const string BgmVolumePreferenceKey = "BgmVolume";
    private const string SfxVolumePreferenceKey = "SfxVolume";

    public static AudioManager Instance { get; private set; }

    [Header("Audio Sources")]
    [SerializeField] private AudioSource bgmSource;
    [SerializeField] private AudioSource sfxSource;

    [Header("Audio Clips")]
    [SerializeField] private List<AudioClip> bgmClips = new List<AudioClip>();
    [SerializeField] private List<AudioClip> sfxClips = new List<AudioClip>();

    private bool isBGMMuted = false;
    private bool isSFXMuted = false;
    private float bgmVolume = 1f;
    private float sfxVolume = 1f;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            transform.SetParent(null);
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
            return;
        }

        EnsureDefaultClips();
        ConfigureAudioSources();

        // Load Mute Setting
        isBGMMuted = PlayerPrefs.GetInt(MutePreferenceKey, 0) == 1;
        isSFXMuted = PlayerPrefs.GetInt(SfxMutePreferenceKey, 0) == 1;
        bgmVolume = PlayerPrefs.GetFloat(BgmVolumePreferenceKey, 1f);
        sfxVolume = PlayerPrefs.GetFloat(SfxVolumePreferenceKey, 1f);
        if (bgmSource != null)
        {
            bgmSource.mute = isBGMMuted;
            bgmSource.volume = isBGMMuted ? 0f : bgmVolume;
        }

        if (sfxSource != null)
        {
            sfxSource.mute = isSFXMuted;
            sfxSource.volume = sfxVolume;
        }
    }

    private void EnsureDefaultClips()
    {
        bgmClips.RemoveAll(clip => clip == null);
        sfxClips.RemoveAll(clip => clip == null);

        AddClipIfMissing(bgmClips, Resources.Load<AudioClip>("Sounds/BGM/bgm1"));
        AddClipIfMissing(bgmClips, Resources.Load<AudioClip>("Sounds/BGM/battle"));
        AddClipIfMissing(sfxClips, Resources.Load<AudioClip>("Sounds/Cards/cardPlace"));
        AddClipIfMissing(sfxClips, Resources.Load<AudioClip>("Sounds/Cards/draw"));
        AddClipIfMissing(sfxClips, Resources.Load<AudioClip>("Sounds/Effect/healspell"));
        AddClipIfMissing(sfxClips, Resources.Load<AudioClip>("Sounds/Effect/lose"));
        AddClipIfMissing(sfxClips, Resources.Load<AudioClip>("Sounds/Effect/sword"));
        AddClipIfMissing(sfxClips, CreateDefenseClip());
        AddClipIfMissing(sfxClips, CreateCombineClip());
    }

    private void ConfigureAudioSources()
    {
        if (bgmSource == null)
        {
            bgmSource = gameObject.AddComponent<AudioSource>();
        }

        if (sfxSource == null)
        {
            sfxSource = gameObject.AddComponent<AudioSource>();
        }

        if (bgmSource != null)
        {
            bgmSource.loop = true;
            bgmSource.playOnAwake = true;
        }

        if (sfxSource != null)
        {
            sfxSource.loop = false;
            sfxSource.playOnAwake = false;
        }
    }

    private void AddClipIfMissing(List<AudioClip> clips, AudioClip clip)
    {
        if (clip != null && !clips.Contains(clip))
        {
            clips.Add(clip);
        }
    }

    public void PlaySFX(string clipName)
    {
        if (sfxSource == null) return;

        AudioClip clip = sfxClips.Find(c => c != null && c.name == clipName);
        if (clip != null)
        {
            sfxSource.PlayOneShot(clip);
        }
        else
        {
            Debug.LogWarning("SFX clip not found: " + clipName);
        }
    }

    public void PlayBGM(string clipName)
    {
        if (bgmSource == null) return;

        AudioClip clip = bgmClips.Find(c => c != null && c.name == clipName);
        if (clip != null)
        {
            bgmSource.mute = isBGMMuted;
            bgmSource.volume = isBGMMuted ? 0f : bgmVolume;

            // If it's already playing this exact BGM, do nothing
            if (bgmSource.clip == clip && bgmSource.isPlaying) return;

            bgmSource.clip = clip;
            bgmSource.Play();
        }
        else
        {
            Debug.LogWarning("BGM clip not found: " + clipName);
        }
    }

    public void StopBGM()
    {
        if (bgmSource != null && bgmSource.isPlaying)
        {
            bgmSource.Stop();
        }
    }

    public void PlayLoseSound()
    {
        PlaySFX("lose");
    }

    public void PlayClickSound()
    {
        PlaySFX("cardPlace");
    }

    public void PlayCardPlaceSound()
    {
        PlaySFX("cardPlace");
    }

    public void PlayDrawSound()
    {
        PlaySFX("draw");
    }

    public void PlaySwordSound()
    {
        PlaySFX("sword");
    }

    public void PlayHealSound()
    {
        PlaySFX("healspell");
    }

    public void PlayDefenseSound()
    {
        PlaySFX("defense");
    }

    public void PlayCombineSound()
    {
        PlaySFX("combine");
    }

    public void ToggleMute()
    {
        SetMute(!isBGMMuted);
    }

    public void SetMute(bool muted)
    {
        isBGMMuted = muted;
        if (bgmSource != null)
        {
            bgmSource.mute = isBGMMuted;
            bgmSource.volume = isBGMMuted ? 0f : bgmVolume;
        }

        // Save setting
        PlayerPrefs.SetInt(MutePreferenceKey, isBGMMuted ? 1 : 0);
        PlayerPrefs.Save();
    }

    public bool IsBGMMuted()
    {
        return isBGMMuted;
    }

    public void ToggleSFXMute()
    {
        SetSFXMute(!isSFXMuted);
    }

    public void SetSFXMute(bool muted)
    {
        isSFXMuted = muted;
        if (sfxSource != null)
        {
            sfxSource.mute = isSFXMuted;
        }

        PlayerPrefs.SetInt(SfxMutePreferenceKey, isSFXMuted ? 1 : 0);
        PlayerPrefs.Save();
    }

    public bool IsSFXMuted()
    {
        return isSFXMuted;
    }

    public void SetBGMVolume(float volume)
    {
        bgmVolume = Mathf.Clamp01(volume);
        if (bgmSource != null)
        {
            bgmSource.volume = isBGMMuted ? 0f : bgmVolume;
        }

        PlayerPrefs.SetFloat(BgmVolumePreferenceKey, bgmVolume);
    }

    public void SetSFXVolume(float volume)
    {
        sfxVolume = Mathf.Clamp01(volume);
        if (sfxSource != null)
        {
            sfxSource.volume = sfxVolume;
        }

        PlayerPrefs.SetFloat(SfxVolumePreferenceKey, sfxVolume);
    }

    public float GetBGMVolume()
    {
        return bgmVolume;
    }

    public float GetSFXVolume()
    {
        return sfxVolume;
    }

    private AudioClip CreateDefenseClip()
    {
        return CreateProceduralClip("defense", 0.24f, (time, progress) =>
        {
            float frequency = Mathf.Lerp(420f, 680f, progress);
            float metallicTone = Mathf.Sin(2f * Mathf.PI * frequency * time);
            float overtone = Mathf.Sin(2f * Mathf.PI * frequency * 2.7f * time) * 0.35f;
            return (metallicTone + overtone) * 0.38f;
        });
    }

    private AudioClip CreateCombineClip()
    {
        return CreateProceduralClip("combine", 0.32f, (time, progress) =>
        {
            float firstTone = Mathf.Sin(2f * Mathf.PI * Mathf.Lerp(520f, 880f, progress) * time);
            float secondTone = Mathf.Sin(2f * Mathf.PI * Mathf.Lerp(780f, 1320f, progress) * time);
            return (firstTone * 0.28f) + (secondTone * 0.2f);
        });
    }

    private AudioClip CreateProceduralClip(string clipName, float duration, System.Func<float, float, float> sample)
    {
        const int sampleRate = 44100;
        int sampleCount = Mathf.CeilToInt(sampleRate * duration);
        float[] samples = new float[sampleCount];

        for (int i = 0; i < sampleCount; i++)
        {
            float time = i / (float)sampleRate;
            float progress = i / (float)(sampleCount - 1);
            float attack = Mathf.Clamp01(progress / 0.06f);
            float release = Mathf.Clamp01((1f - progress) / 0.3f);
            samples[i] = sample(time, progress) * attack * release;
        }

        AudioClip clip = AudioClip.Create(clipName, sampleCount, 1, sampleRate, false);
        clip.SetData(samples, 0);
        return clip;
    }
}
