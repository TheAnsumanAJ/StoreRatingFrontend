import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Store,
  Users,
  Star,
  Plus,
  Search,
  MapPin,
  ShieldCheck,
  X,
  LogOut,
  RefreshCw,
  Mail,
  User,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import ChangePassword from "../components/ChangePassword";

const EMPTY_USER = {
  name: "",
  email: "",
  password: "",
  address: "",
  role: "NORMAL_USER",
};

const EMPTY_STORE = {
  name: "",
  email: "",
  address: "",
  ownerId: "",
};

function getPayload(response) {
  return response?.data?.data ?? response?.data ?? {};
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function getList(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function formatRole(role = "") {
  return role
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

// -------------------- REUSABLE SEARCH BAR --------------------
function SearchBar({ placeholder, search, setSearch }) {
  return (
    <div className="relative w-full sm:w-80">
      <Search
        size={18}
        className="absolute left-3 top-3.5 text-slate-400"
      />
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
      />
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [active, setActive] = useState("Overview");
  const [search, setSearch] = useState("");

  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);

  const [dashboard, setDashboard] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalRatings: 0,
  });

  const [ownerOptions, setOwnerOptions] = useState([]);
  const [adminName, setAdminName] = useState("Admin User");

  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [error, setError] = useState("");
  const [usersError, setUsersError] = useState("");
  const [formError, setFormError] = useState("");

  const [showUserForm, setShowUserForm] = useState(false);
  const [showStoreForm, setShowStoreForm] = useState(false);

  const [userForm, setUserForm] = useState(EMPTY_USER);
  const [storeForm, setStoreForm] = useState(EMPTY_STORE);

  // -------------------- LOAD DASHBOARD STATS --------------------

  const fetchDashboardStats = useCallback(async () => {
    const response = await api.get("/admin/dashboard");
    const data = getPayload(response);

    setDashboard({
      totalUsers: Number(data.totalUsers ?? data.total_users ?? 0),
      totalStores: Number(data.totalStores ?? data.total_stores ?? 0),
      totalRatings: Number(data.totalRatings ?? data.total_ratings ?? 0),
    });
  }, []);

  // -------------------- LOAD STORES --------------------

  const fetchStores = useCallback(async () => {
    const response = await api.get("/admin/stores");
    const data = getPayload(response);
    const list = getList(data, "stores");

    setStores(
      list.map((store) => ({
        id: store.id ?? store.storeId,
        name: store.name ?? store.storeName ?? "Unnamed Store",
        email: store.email ?? "",
        address: store.address ?? "",
        rating: Number(
          store.averageRating ??
            store.average_rating ??
            store.rating ??
            0
        ),
        reviews: Number(
          store.totalRatings ??
            store.total_ratings ??
            store.reviewCount ??
            store.reviews ??
            0
        ),
        ownerId: store.owner_id ?? store.ownerId ?? null,
      }))
    );
  }, []);

  // -------------------- LOAD USERS --------------------

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError("");

    try {
      const response = await api.get("/admin/users", {
        params: { limit: 100 },
      });

      const data = getPayload(response);
      const list = getList(data, "users");

      setUsers(list);
    } catch (err) {
      setUsersError(getErrorMessage(err));
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // -------------------- LOAD STORE OWNERS --------------------

  const loadOwnerOptions = useCallback(async () => {
    try {
      const response = await api.get("/admin/users", {
        params: { role: "STORE_OWNER", limit: 100 },
      });

      const data = getPayload(response);
      const list = getList(data, "users");

      setOwnerOptions(
        list.filter((user) => user.role === "STORE_OWNER")
      );
    } catch (err) {
      setFormError(`Could not load store owners: ${getErrorMessage(err)}`);
    }
  }, []);

  // -------------------- INITIAL DASHBOARD LOAD --------------------

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setAdminName(user.name || user.fullName || "Admin User");
        } catch {
          setAdminName("Admin User");
        }
      }

      await Promise.all([
        fetchDashboardStats(),
        fetchStores(),
      ]);
    } catch (err) {
      setError(getErrorMessage(err));

      if (
        err?.response?.status === 401 ||
        err?.response?.status === 403
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardStats, fetchStores, navigate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (active === "Users") {
      fetchUsers();
    }
  }, [active, fetchUsers]);

  // -------------------- FORM CONTROLS --------------------

  function openUserForm() {
    setFormError("");
    setUserForm(EMPTY_USER);
    setShowStoreForm(false);
    setShowUserForm(true);
  }

  async function openStoreForm() {
    setFormError("");
    setStoreForm(EMPTY_STORE);
    setShowUserForm(false);
    setShowStoreForm(true);
    await loadOwnerOptions();
  }

  function closeForms() {
    setShowUserForm(false);
    setShowStoreForm(false);
    setFormError("");
  }

  // -------------------- CREATE USER --------------------

  function validateUser() {
    const name = userForm.name.trim();
    const address = userForm.address.trim();
    const email = userForm.email.trim();
    const password = userForm.password;

    if (name.length < 20 || name.length > 60) {
      return "Name must contain 20 to 60 characters.";
    }

    if (address.length > 400) {
      return "Address cannot exceed 400 characters.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Enter a valid email address.";
    }

    if (
      password.length < 8 ||
      password.length > 16 ||
      !/[A-Z]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      return "Password must be 8–16 characters and include an uppercase letter and a special character.";
    }

    if (
      !["NORMAL_USER", "SYSTEM_ADMIN", "STORE_OWNER"].includes(userForm.role)
    ) {
      return "Select a valid role.";
    }

    return "";
  }

  async function handleCreateUser(event) {
    event.preventDefault();
    setFormError("");

    const validationError = validateUser();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormLoading(true);

    try {
      await api.post("/admin/users", {
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        password: userForm.password,
        address: userForm.address.trim(),
        role: userForm.role,
      });

      const createdRole = userForm.role;

      setUserForm(EMPTY_USER);
      setShowUserForm(false);
      setActive("Users");

      await Promise.all([
        fetchDashboardStats(),
        fetchUsers(),
      ]);

      if (createdRole === "STORE_OWNER") {
        await loadOwnerOptions();
      }

      window.alert("User created successfully.");
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  }

  // -------------------- CREATE STORE --------------------

  async function handleCreateStore(event) {
    event.preventDefault();
    setFormError("");

    const name = storeForm.name.trim();
    const email = storeForm.email.trim();
    const address = storeForm.address.trim();

    if (!name) {
      setFormError("Store name is required.");
      return;
    }

    if (name.length > 60) {
      setFormError("Store name cannot exceed 60 characters.");
      return;
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setFormError("Enter a valid store email address.");
      return;
    }

    if (address.length > 400) {
      setFormError("Store address cannot exceed 400 characters.");
      return;
    }

    setFormLoading(true);

    try {
      await api.post("/admin/stores", {
        name,
        email: email || null,
        address,
        ownerId: storeForm.ownerId
          ? Number(storeForm.ownerId)
          : null,
      });

      setStoreForm(EMPTY_STORE);
      setShowStoreForm(false);
      setActive("Stores");

      await Promise.all([
        fetchStores(),
        fetchDashboardStats(),
      ]);

      window.alert("Store created successfully.");
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  }

  // -------------------- LOGOUT --------------------

  async function handleLogout() {
    try {
      await logout();
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      navigate("/login");
    }
  }

  // -------------------- NAVIGATION AND FILTERING --------------------

  const navItems = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Stores", icon: Store },
    { label: "Users", icon: Users },
    { label: "Ratings", icon: Star },
    { label: "Change Password", icon: Lock },
  ];

  const query = search.trim().toLowerCase();

  const filteredStores = stores.filter((store) =>
    `${store.name} ${store.email} ${store.address}`
      .toLowerCase()
      .includes(query)
  );

  const filteredUsers = users.filter((user) =>
    `${user.name ?? ""} ${user.email ?? ""} ${user.address ?? ""} ${user.role ?? ""}`
      .toLowerCase()
      .includes(query)
  );

  const stats = [
    {
      label: "Total Users",
      value: dashboard.totalUsers,
      icon: Users,
      color: "bg-violet-100 text-violet-700",
    },
    {
      label: "Total Stores",
      value: dashboard.totalStores,
      icon: Store,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Ratings Submitted",
      value: dashboard.totalRatings,
      icon: Star,
      color: "bg-amber-100 text-amber-700",
    },
  ];

  // -------------------- PAGE UI --------------------

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-800 md:flex">
      {/* SIDEBAR */}
      <aside className="flex w-full flex-col border-r border-slate-200 bg-white md:sticky md:top-0 md:h-screen md:w-64 md:flex-shrink-0">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white">
            <Store size={23} />
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-tight">RateWise</h1>
            <p className="text-xs text-slate-500">
              Store Rating Platform
            </p>
          </div>
        </div>

        <div className="px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const selected = active === item.label;

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setActive(item.label);
                    setSearch("");
                    closeForms();
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                    selected
                      ? "bg-violet-50 text-violet-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={19} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-slate-100 p-4">
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
              {adminName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {adminName}
              </p>
              <p className="text-xs text-slate-500">
                System Administrator
              </p>
            </div>

            <ShieldCheck size={18} className="text-violet-600" />
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        {/* HEADER */}
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-1 text-sm text-slate-500">
              Workspace / {active}
            </p>

            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {active === "Overview"
                ? "Dashboard Overview"
                : active === "Stores"
                  ? "Store Management"
                  : active === "Users"
                    ? "User Management"
                    : active === "Ratings"
                      ? "Rating Overview"
                      : "Change Password"}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Manage your platform, users, stores, and ratings.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={openUserForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Users size={17} />
              Add User
            </button>

            <button
              onClick={openStoreForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              <Plus size={18} />
              Add Store
            </button>
          </div>
        </header>

        {/* GLOBAL ERROR */}
        {error && (
          <div className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span>{error}</span>
            <button onClick={loadDashboard} title="Retry">
              <RefreshCw size={17} />
            </button>
          </div>
        )}

        {/* STATISTICS */}
        <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.label}
                    </p>

                    <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                      {loading ? "—" : stat.value.toLocaleString()}
                    </p>
                  </div>

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}
                  >
                    <Icon size={22} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* CREATE USER FORM */}
        {showUserForm && (
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Create New User
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add an administrator, normal user, or store owner.
                </p>
              </div>

              <button onClick={closeForms} aria-label="Close user form">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {formError}
              </p>
            )}

            <form onSubmit={handleCreateUser} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    Full name (20–60 characters)
                  </span>
                  <span className="relative block">
                    <User
                      size={17}
                      className="absolute left-3 top-3.5 text-slate-400"
                    />
                    <input
                      required
                      minLength={20}
                      maxLength={60}
                      value={userForm.name}
                      onChange={(e) =>
                        setUserForm({ ...userForm, name: e.target.value })
                      }
                      placeholder="Enter full name"
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    Email address
                  </span>
                  <span className="relative block">
                    <Mail
                      size={17}
                      className="absolute left-3 top-3.5 text-slate-400"
                    />
                    <input
                      required
                      type="email"
                      value={userForm.email}
                      onChange={(e) =>
                        setUserForm({ ...userForm, email: e.target.value })
                      }
                      placeholder="user@example.com"
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    Password
                  </span>
                  <span className="relative block">
                    <Lock
                      size={17}
                      className="absolute left-3 top-3.5 text-slate-400"
                    />
                    <input
                      required
                      type="password"
                      minLength={8}
                      maxLength={16}
                      value={userForm.password}
                      onChange={(e) =>
                        setUserForm({ ...userForm, password: e.target.value })
                      }
                      placeholder="8–16 characters"
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">
                    Include an uppercase letter and a special character.
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    Role
                  </span>
                  <select
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm({ ...userForm, role: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="NORMAL_USER">Normal User</option>
                    <option value="STORE_OWNER">Store Owner</option>
                    <option value="SYSTEM_ADMIN">
                      System Administrator
                    </option>
                  </select>
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium">
                    Address
                  </span>
                  <textarea
                    maxLength={400}
                    rows={3}
                    value={userForm.address}
                    onChange={(e) =>
                      setUserForm({ ...userForm, address: e.target.value })
                    }
                    placeholder="Enter address (maximum 400 characters)"
                    className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeForms}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {formLoading ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* CREATE STORE FORM */}
        {showStoreForm && (
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Create New Store
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add a store and optionally assign a store owner.
                </p>
              </div>

              <button onClick={closeForms} aria-label="Close store form">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {formError}
              </p>
            )}

            <form onSubmit={handleCreateStore} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    Store name
                  </span>
                  <input
                    required
                    maxLength={60}
                    value={storeForm.name}
                    onChange={(e) =>
                      setStoreForm({ ...storeForm, name: e.target.value })
                    }
                    placeholder="Enter store name"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    Store email
                  </span>
                  <input
                    type="email"
                    value={storeForm.email}
                    onChange={(e) =>
                      setStoreForm({ ...storeForm, email: e.target.value })
                    }
                    placeholder="store@example.com"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium">
                    Store address
                  </span>
                  <textarea
                    maxLength={400}
                    rows={3}
                    value={storeForm.address}
                    onChange={(e) =>
                      setStoreForm({ ...storeForm, address: e.target.value })
                    }
                    placeholder="Enter store address"
                    className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium">
                    Assign store owner (optional)
                  </span>
                  <select
                    value={storeForm.ownerId}
                    onChange={(e) =>
                      setStoreForm({ ...storeForm, ownerId: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="">No owner assigned</option>
                    {ownerOptions.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name} — {owner.email}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-xs text-slate-400">
                    Only existing Store Owner accounts are listed.
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeForms}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {formLoading ? "Creating..." : "Create Store"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ====================================================== */}
        {/* OVERVIEW PAGE */}
        {/* ====================================================== */}

        {!showUserForm && !showStoreForm && active === "Overview" && (
          <div className="space-y-8">
            <section className="flex flex-col justify-between gap-5 rounded-2xl bg-gradient-to-r from-violet-700 to-indigo-600 p-6 text-white sm:flex-row sm:items-center sm:p-8">
              <div>
                <p className="text-sm font-medium text-violet-100">
                  ADMIN WORKSPACE
                </p>
                <h3 className="mt-2 text-2xl font-bold sm:text-3xl">
                  Welcome, {adminName}
                </h3>
                <p className="mt-2 max-w-xl text-sm text-violet-100">
                  Monitor users, stores, and ratings across the RateWise
                  platform.
                </p>
              </div>

              <button
                onClick={loadDashboard}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-white px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50 sm:self-center"
              >
                <RefreshCw size={17} />
                Refresh data
              </button>
            </section>

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <article
                    key={stat.label}
                    className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-500">
                        {stat.label}
                      </p>
                      <div className={`rounded-xl p-3 ${stat.color}`}>
                        <Icon size={22} />
                      </div>
                    </div>
                    <p className="mt-5 text-3xl font-bold">
                      {loading ? "—" : stat.value.toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      Current platform total
                    </p>
                  </article>
                );
              })}
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">Recently listed stores</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    A quick view of stores registered on the platform.
                  </p>
                </div>

                <button
                  onClick={() => setActive("Stores")}
                  className="text-sm font-semibold text-violet-700 hover:text-violet-900"
                >
                  View all
                </button>
              </div>

              {loading ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Loading stores...
                </p>
              ) : stores.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No stores have been added yet.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stores.slice(0, 5).map((store) => (
                    <div
                      key={store.id}
                      className="flex items-center justify-between gap-4 py-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100 font-bold text-violet-700">
                          {store.name
                            .split(/\s+/)
                            .map((word) => word[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {store.name}
                          </p>
                          <p className="truncate text-sm text-slate-500">
                            {store.address || "Address not provided"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-shrink-0 items-center gap-1 text-sm font-semibold">
                        <Star
                          size={16}
                          className="fill-amber-400 text-amber-400"
                        />
                        {store.rating.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ====================================================== */}
        {/* STORES PAGE */}
        {/* ====================================================== */}

        {!showUserForm && !showStoreForm && active === "Stores" && (
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
              <div>
                <h3 className="text-lg font-bold">Store Directory</h3>
                <p className="mt-1 text-sm text-slate-500">
                  View stores, addresses, and customer ratings.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <SearchBar placeholder="Search stores..." search={search} setSearch={setSearch} />

                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await Promise.all([
                        fetchStores(),
                        fetchDashboardStats(),
                      ]);
                    } catch (err) {
                      setError(getErrorMessage(err));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  title="Refresh stores"
                  className="flex items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-600 hover:bg-slate-50"
                >
                  <RefreshCw size={17} />
                </button>
              </div>
            </div>

            {loading ? (
              <p className="p-12 text-center text-sm text-slate-500">
                Loading stores...
              </p>
            ) : filteredStores.length === 0 ? (
              <div className="p-12 text-center">
                <Store size={30} className="mx-auto mb-3 text-slate-300" />
                <p className="font-semibold">No stores found</p>
                <p className="mt-1 text-sm text-slate-500">
                  {query
                    ? "Try another search term."
                    : "Create your first store using Add Store."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Store</th>
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold">Address</th>
                      <th className="px-6 py-4 font-semibold">Rating</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredStores.map((store) => (
                      <tr key={store.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 font-bold text-violet-700">
                              {store.name
                                .split(/\s+/)
                                .map((word) => word[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold">{store.name}</p>
                              <p className="text-xs text-slate-400">
                                Store #{store.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {store.email || "—"}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex max-w-xs items-start gap-2 text-sm text-slate-600">
                            <MapPin
                              size={16}
                              className="mt-0.5 flex-shrink-0 text-slate-400"
                            />
                            <span>{store.address || "Address not provided"}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 font-semibold">
                              <Star
                                size={16}
                                className="fill-amber-400 text-amber-400"
                              />
                              {store.rating.toFixed(1)}
                            </span>
                            <span className="text-xs text-slate-400">
                              ({store.reviews} ratings)
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
                  Showing {filteredStores.length} of {stores.length} stores
                </div>
              </div>
            )}
          </section>
        )}

        {/* ====================================================== */}
        {/* USERS PAGE */}
        {/* ====================================================== */}

        {!showUserForm && !showStoreForm && active === "Users" && (
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
              <div>
                <h3 className="text-lg font-bold">User Directory</h3>
                <p className="mt-1 text-sm text-slate-500">
                  View normal users, store owners, and administrators.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <SearchBar placeholder="Search name, email, role..." search={search} setSearch={setSearch} />

                <button
                  onClick={fetchUsers}
                  title="Refresh users"
                  className="flex items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-600 hover:bg-slate-50"
                >
                  <RefreshCw size={17} />
                </button>
              </div>
            </div>

            {usersError && (
              <p className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {usersError}
              </p>
            )}

            {usersLoading ? (
              <p className="p-12 text-center text-sm text-slate-500">
                Loading users...
              </p>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center">
                <Users size={30} className="mx-auto mb-3 text-slate-300" />
                <p className="font-semibold">No users found</p>
                <p className="mt-1 text-sm text-slate-500">
                  {query
                    ? "Try another search term."
                    : "Create a user with the Add User button."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Name</th>
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold">Address</th>
                      <th className="px-6 py-4 font-semibold">Role</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700">
                              {(user.name || "U")
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold">
                                {user.name || "Unnamed user"}
                              </p>
                              <p className="text-xs text-slate-400">
                                User #{user.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {user.email || "—"}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {user.address || "—"}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                            {formatRole(user.role)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
                  Showing {filteredUsers.length} of {users.length} users
                </div>
              </div>
            )}
          </section>
        )}

        {/* ====================================================== */}
        {/* RATINGS PAGE */}
        {/* ====================================================== */}

        {!showUserForm && !showStoreForm && active === "Ratings" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
                  <Star size={24} />
                </div>

                <div>
                  <h3 className="text-lg font-bold">Platform Ratings</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Summary of submitted ratings and each store's average score.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-500">
                    Total ratings submitted
                  </p>
                  <p className="mt-3 text-3xl font-bold">
                    {dashboard.totalRatings.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-500">
                    Stores with rating data
                  </p>
                  <p className="mt-3 text-3xl font-bold">
                    {stores.filter((store) => store.reviews > 0).length}
                  </p>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
                <div>
                  <h3 className="text-lg font-bold">Store Rating Summary</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Average rating and rating count for every store.
                  </p>
                </div>

                <SearchBar placeholder="Search stores..." search={search} setSearch={setSearch} />
              </div>

              {filteredStores.length === 0 ? (
                <p className="p-10 text-center text-sm text-slate-500">
                  No matching stores found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Store</th>
                        <th className="px-6 py-4 font-semibold">
                          Average Rating
                        </th>
                        <th className="px-6 py-4 font-semibold">
                          Rating Count
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredStores.map((store) => (
                        <tr key={store.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-semibold">
                            {store.name}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-2 font-semibold">
                              <Star
                                size={16}
                                className="fill-amber-400 text-amber-400"
                              />
                              {store.rating.toFixed(1)} / 5
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {store.reviews}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* CHANGE PASSWORD PAGE */}
        {!showUserForm &&
          !showStoreForm &&
          active === "Change Password" && (
            <section className="mx-auto max-w-2xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
              <ChangePassword />
            </section>
          )}
      </main>
    </div>
  );
}