using System;
using System.Collections;
using System.Linq.Expressions;
using System.Reflection;
using NUnit.Framework;

public class ActionSystemReactionTests
{
    [SetUp]
    public void SetUp()
    {
        ResetActionSystemStaticState();
    }

    [TearDown]
    public void TearDown()
    {
        ResetActionSystemStaticState();
    }

    [Test]
    public void SubscribeReaction_DoesNotDuplicateTheSameCallback()
    {
        Type attackHeroActionType = GetGameType("AttackHeroGA");
        Delegate reaction = CreateNoOpAction(attackHeroActionType);

        SubscribeReaction(attackHeroActionType, reaction, "POST");
        SubscribeReaction(attackHeroActionType, reaction, "POST");

        Assert.AreEqual(1, GetPostSubscriptionCount(attackHeroActionType));
    }

    [Test]
    public void UnsubscribeReaction_RemovesTheOriginalCallback()
    {
        Type attackHeroActionType = GetGameType("AttackHeroGA");
        Delegate reaction = CreateNoOpAction(attackHeroActionType);

        SubscribeReaction(attackHeroActionType, reaction, "POST");
        UnsubscribeReaction(attackHeroActionType, reaction, "POST");

        Assert.AreEqual(0, GetPostSubscriptionCount(attackHeroActionType));
    }

    [Test]
    public void ReactionCanBeSubscribedAgainAfterUnsubscribe()
    {
        Type attackHeroActionType = GetGameType("AttackHeroGA");
        Delegate reaction = CreateNoOpAction(attackHeroActionType);

        SubscribeReaction(attackHeroActionType, reaction, "POST");
        UnsubscribeReaction(attackHeroActionType, reaction, "POST");
        SubscribeReaction(attackHeroActionType, reaction, "POST");

        Assert.AreEqual(1, GetPostSubscriptionCount(attackHeroActionType));
    }

    private static int GetPostSubscriptionCount(Type actionType)
    {
        IDictionary postSubs = GetStaticDictionary("postSubs");
        if (!postSubs.Contains(actionType))
        {
            return 0;
        }

        return ((ICollection)postSubs[actionType]).Count;
    }

    private static IDictionary GetStaticDictionary(string fieldName)
    {
        FieldInfo field = GetGameType("ActionSystem").GetField(fieldName, BindingFlags.NonPublic | BindingFlags.Static);
        Assert.NotNull(field, "Could not find ActionSystem." + fieldName);
        return (IDictionary)field.GetValue(null);
    }

    private static void ResetActionSystemStaticState()
    {
        MethodInfo resetMethod = GetGameType("ActionSystem").GetMethod("ResetStaticState", BindingFlags.NonPublic | BindingFlags.Static);
        Assert.NotNull(resetMethod, "Could not find ActionSystem.ResetStaticState.");
        resetMethod.Invoke(null, null);
    }

    private static void SubscribeReaction(Type actionType, Delegate reaction, string timingName)
    {
        InvokeReactionMethod("SubscribeReaction", actionType, reaction, timingName);
    }

    private static void UnsubscribeReaction(Type actionType, Delegate reaction, string timingName)
    {
        InvokeReactionMethod("UnsubscribeReaction", actionType, reaction, timingName);
    }

    private static void InvokeReactionMethod(string methodName, Type actionType, Delegate reaction, string timingName)
    {
        Type actionSystemType = GetGameType("ActionSystem");
        Type timingType = GetGameType("ReactionTiming");
        object timing = Enum.Parse(timingType, timingName);
        MethodInfo method = actionSystemType.GetMethod(methodName, BindingFlags.Public | BindingFlags.Static);
        Assert.NotNull(method, "Could not find ActionSystem." + methodName + ".");
        method.MakeGenericMethod(actionType).Invoke(null, new[] { reaction, timing });
    }

    private static Delegate CreateNoOpAction(Type parameterType)
    {
        Type actionType = typeof(Action<>).MakeGenericType(parameterType);
        ParameterExpression parameter = Expression.Parameter(parameterType, "action");
        return Expression.Lambda(actionType, Expression.Empty(), parameter).Compile();
    }

    private static Type GetGameType(string typeName)
    {
        Type type = Type.GetType(typeName + ", Assembly-CSharp");
        Assert.NotNull(type, "Could not find " + typeName + " in Assembly-CSharp.");
        return type;
    }
}
