import { useAuth } from "@/providers/AuthProvider";
import { useAntd } from "@/providers/ThemeProvider";
import { ArrowLeftOutlined, LogoutOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
function Footer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { message } = useAntd();

  // Check if the current path is not the home page
  const showBackButton = !["/", "/home"].includes(location.pathname);

  return (
    <>
      <footer className="flex flex-col justify-center items-center gap-4 w-full">
        <div className="flex items-center w-full px-4 py-2">
          <div className="flex justify-between items-center gap-4 w-full">
            <Button
              type="primary"
              onClick={() => {
                signOut().then(() => {
                  message.success("Successfully signed out!");
                  navigate("/");
                });
              }}
              icon={<LogoutOutlined />}
              block
              danger
            >
              Logout
            </Button>
            {showBackButton && (
              <Button
                type="primary"
                onClick={() => navigate(-1)}
                icon={<ArrowLeftOutlined />}
                block
              >
                Back
              </Button>
            )}
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;
