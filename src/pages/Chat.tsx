import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AIChat from "@/components/AIChat";
import ConversationList from "@/components/ConversationList";

const Chat = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('projectId');
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(conversationId);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(projectIdFromUrl || undefined);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    setSelectedConversationId(conversationId);
  }, [conversationId]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Conversation List Sidebar */}
      <ConversationList
        selectedConversationId={selectedConversationId}
        onSelectConversation={(id, projectId) => {
          setSelectedConversationId(id);
          setSelectedProjectId(projectId);
          navigate(`/chat/${id}`);
        }}
        onNewConversation={() => {
          setSelectedConversationId(undefined);
          setSelectedProjectId(undefined);
          navigate('/chat');
        }}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <nav className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </nav>

        <div className="flex-1 overflow-hidden">
          <AIChat 
            conversationId={selectedConversationId}
            projectId={selectedProjectId}
            onConversationCreated={(newConversationId) => {
              setSelectedConversationId(newConversationId);
              navigate(`/chat/${newConversationId}`);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
