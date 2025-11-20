import { useState } from "react";
import { Toaster } from "sonner";
import HomePage from "./pages/HomePage";
import LifeAreaDetailPage from "./pages/LifeAreaDetailPage";
import LifeAreasManagementPage from "./pages/LifeAreasManagementPage";
import HistoryPage from "./pages/HistoryPage";
import type { Page } from "./types";

interface NavigationState {
  page: Page;
  data?: any;
}

function App() {
  const [navigation, setNavigation] = useState<NavigationState>({ page: "home" });

  const handleNavigate = (page: Page, data?: any) => {
    if (page === "detail" && data) {
      // Store the previous page when navigating to detail
      setNavigation({ page, data: { ...data, fromPage: navigation.page } });
    } else {
      setNavigation({ page, data });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster 
        position="top-right" 
        richColors 
        closeButton 
        duration={3000}
        expand={true}
        gap={0}
      />

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-7xl h-screen flex flex-col">
        {navigation.page === "home" && <HomePage onNavigate={handleNavigate} />}
        {navigation.page === "detail" && (
          <LifeAreaDetailPage
            areaId={navigation.data?.areaId}
            fromPage={navigation.data?.fromPage}
            onNavigate={handleNavigate}
          />
        )}
        {navigation.page === "manage" && (
          <LifeAreasManagementPage onNavigate={handleNavigate} />
        )}
        {navigation.page === "history" && (
          <HistoryPage onNavigate={handleNavigate} />
        )}
      </div>
    </div>
  );
}

export default App;

