import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquarePlus, Trash2 } from 'lucide-react'
import { getUserChats, deleteChat, Chat } from '@/lib/firestore-chat'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from "@/components/ui/use-toast"

interface ChatSidebarProps {
  currentChatId: string | null;
  onChatSelect: (chat: Chat) => void;
  onNewChat: () => void;
}

export function ChatSidebar({ currentChatId, onChatSelect, onNewChat }: ChatSidebarProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);

  // Function to load chats
  const loadChats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userChats = await getUserChats(user.uid);
      setChats(userChats);
    } catch (error) {
      console.error('Error loading chats:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load chats"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load chats when component mounts or user changes
  useEffect(() => {
    loadChats();
  }, [user]);

  // Refresh chats when currentChatId changes
  useEffect(() => {
    loadChats();
  }, [currentChatId]);

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chat?')) {
      try {
        await deleteChat(chatId);
        await loadChats(); // Refresh the chat list
        toast({
          title: "Success",
          description: "Chat deleted successfully"
        });
      } catch (error) {
        console.error('Error deleting chat:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete chat"
        });
      }
    }
  };

  const handleNewChat = () => {
    onNewChat();
    // No need to manually refresh here as currentChatId change will trigger refresh
  };

  return (
    <div className="w-64 h-full bg-gray-50 border-r flex flex-col">
      <div className="p-4">
        <Button 
          onClick={handleNewChat}
          className="w-full flex items-center gap-2"
          disabled={loading}
        >
          <MessageSquarePlus className="h-4 w-4" />
          {loading ? 'Loading...' : 'New Chat'}
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onChatSelect(chat)}
              className={`p-3 rounded-lg cursor-pointer flex items-center justify-between group
                ${currentChatId === chat.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium truncate">{chat.title}</h3>
                <p className="text-xs text-gray-500 truncate">
                  {chat.topic} • {chat.difficulty}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100"
                onClick={(e) => handleDeleteChat(chat.id, e)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {chats.length === 0 && !loading && (
            <div className="text-center text-gray-500 py-4">
              No chats yet. Start a new conversation!
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
} 