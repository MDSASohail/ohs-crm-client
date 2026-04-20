import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useSidebar } from "../../hooks/useSidebar";

const PageWrapper = ({ title, children }) => {
  const { isOpen, toggle, close } = useSidebar();

  return (
    <div className="min-h-screen bg-neutral">
      {/* Sidebar — receives open state and close handler */}
      <Sidebar isOpen={isOpen} onClose={close} />

      {/* Topbar — receives menu toggle for mobile hamburger */}
      <Topbar title={title} onMenuClick={toggle} />

      {/* Main content area — shifts right based on sidebar width */}
      <main
        className="pt-16 min-h-screen transition-all duration-300 ml-0 md:ml-16 lg:ml-64"
      >
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default PageWrapper;