import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-neutral gap-4">
      <h1 className="text-4xl font-bold text-primary">404</h1>
      <p className="text-muted">Page not found.</p>
      <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
    </div>
  );
};

export default NotFoundPage;