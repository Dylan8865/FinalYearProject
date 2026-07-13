using UnityEngine;

public static class MouseUtil 
{
    private static Camera camera;

    public static Vector3 GetMousePositionInWorldSpace(float zValue = 0f)
    {
        if (camera == null)
        {
            camera = Camera.main;
        }

        if (camera == null)
        {
            Debug.LogWarning("MouseUtil could not find the Main Camera.");
            return Vector3.zero;
        }

        Plane dragPlane = new(camera.transform.forward, new Vector3(0, 0, zValue));
        Ray ray = camera.ScreenPointToRay(Input.mousePosition);
        if(dragPlane.Raycast(ray, out float distance))
        {
            return ray.GetPoint(distance);
        }
        return Vector3.zero;
    }
}
