import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";
import { UserNav } from "./UserNav";
import { MainNav } from "./MainNav";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate("/login");
    }
  }, [session, navigate]);

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="flex h-16 items-center px-4 container mx-auto">
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold gradient-text">NotionGPT</span>
            <MainNav />
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-4">
        {children}
      </main>
    </div>
  );
}