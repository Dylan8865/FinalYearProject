using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class ActionSystem : Singleton<ActionSystem>
{
    private class ReactionSubscription
    {
        public Action<GameAction> WrappedReaction { get; }
        public Delegate OriginalReaction { get; }

        public ReactionSubscription(Action<GameAction> wrappedReaction, Delegate originalReaction)
        {
            WrappedReaction = wrappedReaction;
            OriginalReaction = originalReaction;
        }
    }

    private List<GameAction> reactions = null;
    public bool IsPerforming { get; private set; } = false;
    private static Dictionary<Type, List<ReactionSubscription>> preSubs = new();
    private static Dictionary<Type, List<ReactionSubscription>> postSubs = new();
    private static Dictionary<Type, Func<GameAction, IEnumerator>> performers = new();

    public void Perform(GameAction action, System.Action OnPerformFinished = null)
    {
        if (IsPerforming) return;
        IsPerforming = true;
        StartCoroutine(Flow(action, () =>
        {
            IsPerforming = false;
            OnPerformFinished?.Invoke();
        }));
    }

    public void AddReaction(GameAction gameAction)
    {
        reactions?.Add(gameAction);
    }

    private IEnumerator Flow(GameAction action, Action OnFlowFinished = null)
    {
        List<GameAction> previousReactions = reactions;

        reactions = action.PreReactions;
        PerformSubscribers(action, preSubs);
        yield return PerformReactions(reactions);

        reactions = action.PerformReactions;
        yield return PerformPerformer(action);
        yield return PerformReactions(reactions);

        reactions = action.PostReactions;
        PerformSubscribers(action, postSubs);
        yield return PerformReactions(reactions);

        reactions = previousReactions;
        OnFlowFinished?.Invoke();
    }

    private IEnumerator PerformPerformer(GameAction action)
    {
        Type type = action.GetType();
        if (performers.ContainsKey(type))
        {
            yield return performers[type](action);
        }
    }

    private void PerformSubscribers(GameAction action, Dictionary<Type, List<ReactionSubscription>> subs)
    {
        Type type = action.GetType();
        if (subs.ContainsKey(type))
        {
            ReactionSubscription[] subscriptions = subs[type].ToArray();
            foreach (var sub in subscriptions)
            {
                sub.WrappedReaction(action);
            }
        }
    }

    private IEnumerator PerformReactions(List<GameAction> reactionQueue)
    {
        for (int i = 0; i < reactionQueue.Count; i++)
        {
            yield return Flow(reactionQueue[i]);
        }
    }

    public static void AttachPerformer<T>(Func<T, IEnumerator> performer) where T : GameAction
    {
        Type type = typeof(T);
        IEnumerator wrappedPerformer(GameAction action) => performer((T)action);
        if (performers.ContainsKey(type)) performers[type] = wrappedPerformer;
        else performers.Add(type, wrappedPerformer);
    }

    public static void DetachPerformer<T>() where T : GameAction
    {
        Type type = typeof(T);
        if (performers.ContainsKey(type)) performers.Remove(type);
    }

    public static void SubscribeReaction<T>(Action<T> reaction, ReactionTiming timing) where T : GameAction
    {
        Dictionary<Type, List<ReactionSubscription>> subs = timing == ReactionTiming.PRE ? preSubs : postSubs;
        Type type = typeof(T);
        void wrappedReaction(GameAction action) => reaction((T)action);

        if (!subs.ContainsKey(type))
        {
            subs.Add(type, new());
        }

        if (subs[type].Exists(sub => sub.OriginalReaction.Equals(reaction)))
        {
            return;
        }

        subs[type].Add(new ReactionSubscription(wrappedReaction, reaction));
    }

    public static void UnsubscribeReaction<T>(Action<T> reaction, ReactionTiming timing) where T : GameAction
    {
        Dictionary<Type, List<ReactionSubscription>> subs = timing == ReactionTiming.PRE ? preSubs : postSubs;
        Type type = typeof(T);
        if (subs.ContainsKey(type))
        {
            subs[type].RemoveAll(sub => sub.OriginalReaction.Equals(reaction));
            if (subs[type].Count == 0)
            {
                subs.Remove(type);
            }
        }
    }

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
    private static void ResetStaticState()
    {
        preSubs.Clear();
        postSubs.Clear();
        performers.Clear();
    }
}
