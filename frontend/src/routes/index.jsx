import { createBrowserRouter } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import RoleRoute from "./RoleRoute";
import AdminLayout from "../components/layout/AdminLayout";
import ParentLayout from "../components/layout/ParentLayout";
import Login from "../pages/auth/Login";
import Setup from "../pages/auth/Setup";
import AdminDashboard from "../pages/admin/Dashboard";
import PaymentStatus from "../pages/admin/PaymentStatus";
import ClassMonitor from "../pages/admin/ClassMonitor";
import Students from "../pages/admin/Students";
import StudentProfile from "../pages/admin/StudentProfile";
import Parents from "../pages/admin/Parents";
import AdminParentProfile from "../pages/admin/ParentProfile";
import Classes from "../pages/admin/Classes";
import Sessions from "../pages/admin/Sessions";
import Payments from "../pages/admin/Payments";
import RecordPayment from "../pages/admin/RecordPayment";
import Reports from "../pages/admin/Reports";
import Settings from "../pages/admin/Settings";
import ParentDashboard from "../pages/parent/Dashboard";
import Children from "../pages/parent/Children";
import ChildDetails from "../pages/parent/ChildDetails";
import ParentPaymentHistory from "../pages/parent/PaymentHistory";
import ParentProfile from "../pages/parent/Profile";
import Fees from '../pages/admin/Fees';
import Enrollments from '../pages/admin/Enrollments';
import PayNow from '../pages/parent/PayNow';
import PaymentVerify from '../pages/parent/PaymentVerify';

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/setup",
    element: <Setup />
  },
  {
    path: "/",
    element: <PrivateRoute />,
    children: [
      {
        path: "admin",
        element: <RoleRoute allowedRoles={["admin"]} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboard /> },
              { path: "dashboard", element: <AdminDashboard /> },
              { path: "payment-status", element: <PaymentStatus /> },
              { path: "payment-status/:classId", element: <ClassMonitor /> },
              { path: "students", element: <Students /> },
              { path: "students/:id", element: <StudentProfile /> },
              { path: "parents", element: <Parents /> },
              { path: "parents/:id", element: <AdminParentProfile /> },
              { path: "classes", element: <Classes /> },
              { path: "sessions", element: <Sessions /> },
              { path: "payments", element: <Payments /> },
              { path: "payments/record", element: <RecordPayment /> },
              { path: "reports", element: <Reports /> },
              { path: "settings", element: <Settings /> },
              { path: 'fees', element: <Fees /> },
              { path: 'enrollments', element: <Enrollments /> },
            ]
          }
        ]
      },
      {
        path: "parent",
        element: <RoleRoute allowedRoles={["parent"]} />,
        children: [
          {
            element: <ParentLayout />,
            children: [
              { index: true, element: <ParentDashboard /> },
              { path: "dashboard", element: <ParentDashboard /> },
              { path: "children", element: <Children /> },
              { path: "children/:id", element: <ChildDetails /> },
              { path: "payments", element: <ParentPaymentHistory /> },
              { path: "profile", element: <ParentProfile /> }

            ]
          }
        ]
      }
    ]
  }
]);

export default router;
