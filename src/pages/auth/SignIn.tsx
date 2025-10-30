import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { imageAssets } from "../../utils/resources";
import { Input, Button } from "../../components";
import { Role } from "../../constants/common";

const SignIn: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);



  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    setUsernameError("");
    setPasswordError("");

    let hasError = false;
    if (!username.trim()) (hasError = true, setUsernameError("Username is required"));
    if (!password.trim()) (hasError = true, setPasswordError("Password is required"));
    if (hasError) return;


    try {
      setSubmitting(true);
      await new Promise((r) => setTimeout(r, 600));

      localStorage.setItem(
        "UserDetails",
        JSON.stringify({ userId: 1, roleId: Role.ADMIN })
      )
      
      navigate("/", { replace: true });

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
                  Sign In
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enter your username, password to access your account.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <Input
                  label="Username *"
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
