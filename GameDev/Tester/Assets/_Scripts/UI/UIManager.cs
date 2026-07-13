using UnityEngine;
using System;
using System.Collections.Generic;

public class UIManager : MonoBehaviour
{
    public static UIManager Instance;

    private Transform canvasTf;

    private List<UIBase> uiList;

    private void Awake()
    {
        Instance = this;
        Canvas parentCanvas = GetComponentInParent<Canvas>();
        if (parentCanvas != null)
        {
            canvasTf = parentCanvas.transform;
        }
        else
        {
            GameObject canvasObject = GameObject.Find("Canvas");
            if (canvasObject != null)
            {
                canvasTf = canvasObject.transform;
            }
        }

        if (canvasTf == null)
        {
            Debug.LogError("UIManager could not find a Canvas for UI prefabs.");
            enabled = false;
            return;
        }

        //初始化集合
        uiList = new List<UIBase>();
    }

    public UIBase ShowUI<T>(String uiName) where T: UIBase
    {
        if (canvasTf == null) return null;

        UIBase ui = Find(uiName);
        if (ui == null)
        {
            Transform existingTransform = canvasTf.Find(uiName);
            if (existingTransform != null)
            {
                ui = existingTransform.GetComponent<T>();
                if (ui == null)
                {
                    ui = existingTransform.gameObject.AddComponent<T>();
                }

                ui.Show();
                uiList.Add(ui);
                return ui;
            }

            //集合中没有 需要从Resource中加载
            GameObject prefab = Resources.Load<GameObject>("UI/" + uiName);
            if (prefab == null)
            {
                Debug.LogError("UI prefab not found in Resources/UI: " + uiName);
                return null;
            }

            GameObject obj = Instantiate(prefab, canvasTf);
            
            //change name
            obj.name = uiName;

            ui = obj.GetComponent<T>();
            if (ui == null)
            {
                ui = obj.AddComponent<T>();
            }
            uiList.Add(ui);
        }
        else
        {
            // show
            ui.Show();
        }
        return ui;        
    }

    public void HideUI(String uiName)
    {
        UIBase ui = Find(uiName);
        if (ui!=null)
        {
            ui.Hide();
        }
    }

    public void CloseAllUI()
    {
        for (int i = uiList.Count - 1; i >= 0; i--)
        { 
            Destroy(uiList[i].gameObject);
        }

        uiList.Clear();//clear list
    }

    public void CloseUI(string uiName)
    {
        UIBase ui = Find(uiName);
        if(ui != null)
        {
            uiList.Remove(ui);
            Destroy(ui.gameObject);
        }
    }

    //从集合中找到名字对应的脚本。

    public UIBase Find(string uiName)
    {
        for (int i = 0; i < uiList.Count; i++)
        {
            if (uiList[i].name == uiName)
            {
                return uiList[i];
            }
        }
        return null;
    }
}
