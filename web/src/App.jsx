import { Route, Routes } from "react-router-dom";
import { MainLayout, OrganizerLayout } from "./components/Layouts";
import ProtectedRoute, { GuestOnly } from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import EventDetail from "./pages/EventDetail";
import OrganizerProfile from "./pages/OrganizerProfile";
import { Login, Register, ForgotPassword, ResetPassword } from "./pages/Auth";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Checkout from "./pages/customer/Checkout";
import Payment from "./pages/customer/Payment";
import MyTickets from "./pages/customer/MyTickets";
import Rewards from "./pages/customer/Rewards";
import Dashboard from "./pages/organizer/Dashboard";
import MyEvents from "./pages/organizer/MyEvents";
import EventForm from "./pages/organizer/EventForm";
import Vouchers from "./pages/organizer/Vouchers";
import Transactions from "./pages/organizer/Transactions";
import Attendees from "./pages/organizer/Attendees";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Explore />} />
        <Route path="/events/:slug" element={<EventDetail />} />
        <Route path="/organizers/:id" element={<OrganizerProfile />} />

        <Route element={<GuestOnly />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        <Route element={<ProtectedRoute roles={["CUSTOMER"]} />}>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/transactions/:id" element={<Payment />} />
          <Route path="/my-tickets" element={<MyTickets />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<ProtectedRoute roles={["ORGANIZER"]} />}>
        <Route path="/organizer" element={<OrganizerLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="events" element={<MyEvents />} />
          <Route path="events/new" element={<EventForm />} />
          <Route path="events/:id/edit" element={<EventForm />} />
          <Route path="events/:id/attendees" element={<Attendees />} />
          <Route path="vouchers" element={<Vouchers />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  );
}
