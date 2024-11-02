import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Layout, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold">NotionGPT</div>
          <Button onClick={() => navigate("/login")} variant="outline">
            Get Started
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6">
            Create Notion Templates with{" "}
            <span className="gradient-text">AI Magic</span>
          </h1>
          <p className="text-xl text-notion-600 mb-8">
            Transform your ideas into beautiful Notion templates through natural
            conversations. Powered by AI, designed for you.
          </p>
          <Button
            onClick={() => navigate("/login")}
            size="lg"
            className="text-lg px-8"
          >
            Start Creating <ArrowRight className="ml-2" />
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="p-6 rounded-xl border bg-white shadow-sm">
            <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Creation</h3>
            <p className="text-notion-600">
              Describe your needs in plain English and watch as AI crafts the
              perfect template.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-white shadow-sm">
            <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mb-4">
              <Layout className="text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Custom Templates</h3>
            <p className="text-notion-600">
              Get templates tailored to your specific needs, ready to use in
              Notion.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-white shadow-sm">
            <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mb-4">
              <Zap className="text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Instant Preview</h3>
            <p className="text-notion-600">
              See your template come to life in real-time before adding it to
              Notion.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;