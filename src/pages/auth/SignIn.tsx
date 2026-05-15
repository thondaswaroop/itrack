import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { imageAssets } from "../../utils/resources";
import { Input, Button } from "../../components";
import { authService } from "../../services";

const SignIn: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    setUsernameError("");
    setPasswordError("");
    setGeneralError("");

    let hasError = false;
    if (!username.trim()) {
      hasError = true;
      setUsernameError("Username is required");
    }
    if (!password.trim()) {
      hasError = true;
      setPasswordError("Password is required");
    }
    if (hasError) return;

    try {
      setSubmitting(true);
      
      // Call the real API
      const response = await authService.login(username, password);
      
      // Store user data in localStorage (done by authService.login -> saveUser)
      // The authService already saves to 'itrack_user'
      
      // Also store in UserDetails format for compatibility with other parts of the app
      const roleId = response.user.role === 'super_admin' ? 1 : 
                     response.user.role === 'vendor' ? 2 : 
                     response.user.role === 'associate' ? 3 : 4;
      
      // Extract hub_id from response data
      let hubId = null;
      if (response.data?.associate?.hub_id) {
        hubId = response.data.associate.hub_id;
      } else if (response.data?.vendor?.hub_id) {
        hubId = response.data.vendor.hub_id;
      }
      
      // Store in UserDetails format (used by components like LoadManagement)
      localStorage.setItem(
        "UserDetails",
        JSON.stringify({ 
          userId: response.user.id, 
          roleId: roleId,
          hubId: hubId
        })
      );
      
      // Navigate to dashboard
      navigate("/", { replace: true });

    } catch (error: any) {
      console.error("Login error:", error);
      setGeneralError(error.message || "Login failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => { if (username) setUsernameError(""); }, [username]);
  useEffect(() => { if (password) setPasswordError(""); }, [password]);

  return (
    <div className="relative z-[1] bg-white p-6 dark:bg-gray-900 sm:p-0">
      {/* IMPORTANT: items-stretch makes both columns the full height */}
      <div className="relative flex h-screen w-full flex-col items-stretch lg:flex-row dark:bg-gray-900 sm:p-0">
        {/* LEFT: form */}
        <div className="flex w-full flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
            <div>
              <div className="flex justify-center items-center">
                <img src={imageAssets.logo} alt="Logo" className="mb-8 h-20 w-auto" />
              </div>
              <div className="mb-5 sm:mb-8">
                <h1 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90 sm:text-title-md">
                  Sign In to iTrack
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enter your username and password to access your account.
                </p>
              </div>

              {generalError && (
                <div className="mb-4 rounded-md bg-red-50 p-3 dark:bg-red-900/20">
                  <p className="text-sm text-red-800 dark:text-red-200">{generalError}</p>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <Input
                  label="Username *"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onValueChange={setUsername}
                  errorMessage={usernameError}
                />

                <Input
                  label="Password *"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onValueChange={setPassword}
                  errorMessage={passwordError}
                />

                <Button
                  type="submit"
                  variant="solid"
                  tone="primary"
                  width="full"
                  size="md"
                  loading={submitting}
                  className="mt-1"
                >
                  Sign in
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
