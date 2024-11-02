import { MainLayout } from "@/components/layout/MainLayout";
import { TemplateChatInterface } from "@/components/chat/TemplateChatInterface";
import { TemplatePreview } from "@/components/preview/TemplatePreview";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

export default function Index() {
  return (
    <MainLayout>
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[calc(100vh-5rem)]"
      >
        <ResizablePanel defaultSize={60}>
          <TemplateChatInterface />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40}>
          <TemplatePreview />
        </ResizablePanel>
      </ResizablePanelGroup>
    </MainLayout>
  );
}