using UnityEngine;
using System.Collections;
using System.Collections.Generic;


public class UIBase : MonoBehaviour
{
    public virtual void Show()
    {
        gameObject.SetActive(true);
    }

    public virtual void Hide()
    {
        gameObject.SetActive(false);
    }
    
    // Close Interface
    public virtual void Close()
    {
        UIManager.Instance.CloseUI(gameObject.name);

    }
 
}
 