// src/routes/ProtectedRoute.tsx
// import React, { useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import Blank from "../pages/Blank";

// interface ProtectedRouteProps {
//   allowedRoles?: number[];
//   children: React.ReactNode;
// }

// const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [authorized, setAuthorized] = useState<boolean>(false);

//   useEffect(() => {
//     const raw = localStorage.getItem("UserDetails");
//     if (!raw) {
//       setAuthorized(false);
//       navigate("/signIn", { replace: true, state: { from: location.pathname } });
//       return;
//     }

//     try {
//       const user = JSON.parse(raw);
//       const role: number | undefined = user?.roleId;

//       if (!role) {
//         setAuthorized(false);
//         navigate("/signIn", { replace: true, state: { from: location.pathname } });
//         return;
//       }

//       if (allowedRoles && !allowedRoles.includes(role)) {
//         setAuthorized(false);
//         return;
//       }

//       setAuthorized(true);
//     } catch {
//       setAuthorized(false);
//       navigate("/signIn", { replace: true, state: { from: location.pathname } });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [location.pathname, allowedRoles]);

//   return authorized ? <>{children}</> : <Blank />;
// };

// export default ProtectedRoute;


// src/routes/ProtectedRoute.tsx
import React, { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import Blank from "../pages/Blank"
import { getUser, hasAnyRole } from "../utils/auth"
import { Role } from "../constants/common"

type Props = { allowedRoles?: Role[]; children: React.ReactNode }

const ProtectedRoute: React.FC<Props> = ({ allowedRoles, children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const user = getUser()
    if (!user?.userId) {
      setAuthorized(false)
      navigate("/signIn", { replace: true, state: { from: location.pathname } })
      return
    }
    if (!hasAnyRole(allowedRoles)) {
      setAuthorized(false)
      // You can keep them on Blank or redirect them to their default home
      // navigate(roleDefaultPath(), { replace: true })
      return
    }
    setAuthorized(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, allowedRoles])

  return authorized ? <>{children}</> : <Blank />
}

export default ProtectedRoute
