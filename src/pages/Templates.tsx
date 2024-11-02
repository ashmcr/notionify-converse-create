import { MainLayout } from "@/components/layout/MainLayout";
import { TemplateCreator } from "@/components/templates/TemplateCreator";

export default function Templates() {
  return (
    <MainLayout>
      <div className="container max-w-7xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Templates</h1>
        <TemplateCreator />
      </div>
    </MainLayout>
  );
}