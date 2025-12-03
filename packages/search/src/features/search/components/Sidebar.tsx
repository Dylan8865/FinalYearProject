"use client";

import { Conversation } from "./SearchPage";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onNewChat: () => void;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation: (id: string) => void;
}

export default function Sidebar({
  isOpen,
  conversations,
  activeConversation,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
}: SidebarProps) {
  const groupConversationsByDate = (conversations: Conversation[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: { [key: string]: Conversation[] } = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: [],
    };

    conversations.forEach((conv) => {
      const date = new Date(conv.createdAt);
      if (date.toDateString() === today.toDateString()) {
        groups.Today.push(conv);
      } else if (date.toDateString() === yesterday.toDateString()) {
        groups.Yesterday.push(conv);
      } else if (date > lastWeek) {
        groups["Previous 7 Days"].push(conv);
      } else {
        groups.Older.push(conv);
      }
    });

    return groups;
  };

  const groupedConversations = groupConversationsByDate(conversations);

  return (
    <aside
      className={`flex h-full flex-col border-r bg-muted/30 transition-all duration-300 ${
        isOpen ? "w-64" : "w-0 overflow-hidden"
      }`}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-3">
        <span className="text-sm font-semibold">History</span>
        <button
          onClick={onNewChat}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
          title="New chat"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            No conversations yet
          </p>
        ) : (
          Object.entries(groupedConversations).map(
            ([group, convs]) =>
              convs.length > 0 && (
                <div key={group} className="mb-4">
                  <h3 className="mb-2 px-2 text-xs font-medium text-muted-foreground">
                    {group}
                  </h3>
                  {convs.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`group relative mb-1 flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm transition-colors ${
                        activeConversation?.id === conversation.id
                          ? "bg-muted"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => onSelectConversation(conversation)}
                    >
                      <svg
                        className="mr-2 h-4 w-4 shrink-0 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span className="flex-1 truncate">{conversation.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conversation.id);
                        }}
                        className="absolute right-2 hidden rounded p-1 text-muted-foreground hover:bg-background hover:text-destructive group-hover:block"
                        title="Delete"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )
          )
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-3">
        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Settings
        </button>
      </div>
    </aside>
  );
}
