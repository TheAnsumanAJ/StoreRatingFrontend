import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Star, Users, LogOut, RefreshCw } from "lucide-react";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext";

export default function OwnerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchDashboard() {
    try {
      setLoading(true);
      setError("");

      const [dashboardResponse, ratingsResponse] = await Promise.all([
        api.get("/owner/dashboard"),
        api.get("/owner/ratings"),
      ]);

      const dashboardData =
        dashboardResponse.data?.data ?? dashboardResponse.data;
      const ratingsData =
        ratingsResponse.data?.data ?? ratingsResponse.data;

      setDashboard(
        Array.isArray(dashboardData)
          ? dashboardData
          : dashboardData.stores ?? []
      );

      setRatings(
        Array.isArray(ratingsData)
          ? ratingsData
          : ratingsData.ratings ?? []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load dashboard. Please check your owner account and API."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  const totalRatings = dashboard.reduce(
    (total, store) =>
      total + Number(store.totalRatings ?? store.total_ratings ?? 0),
    0
  );

  const overallAverage =
    totalRatings > 0
      ? dashboard.reduce(
          (total, store) =>
            total +
            Number(store.averageRating ?? store.average_rating ?? 0) *
              Number(store.totalRatings ?? store.total_ratings ?? 0),
          0
        ) / totalRatings
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="flex items-center justify-between border-b bg-white px-5 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-100 p-2 text-violet-700">
            <Store size={23} />
          </div>
          <div>
            <h1 className="text-xl font-bold">RateWise</h1>
            <p className="text-xs text-slate-500">Owner Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold">{user?.name || "Store Owner"}</p>
            <p className="text-xs text-slate-500">Store Owner</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-100"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-10">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-sm font-medium text-violet-700">
              STORE PERFORMANCE
            </p>
            <h2 className="text-3xl font-bold">Welcome back!</h2>
            <p className="mt-2 text-slate-500">
              Track your store ratings and customer feedback.
            </p>
          </div>

          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-3 font-medium hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-violet-100 p-3 text-violet-700">
              <Store size={22} />
            </div>
            <p className="text-sm text-slate-500">My Stores</p>
            <p className="mt-1 text-3xl font-bold">{dashboard.length}</p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-blue-100 p-3 text-blue-700">
              <Users size={22} />
            </div>
            <p className="text-sm text-slate-500">Total Ratings</p>
            <p className="mt-1 text-3xl font-bold">{totalRatings}</p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-amber-100 p-3 text-amber-600">
              <Star size={22} />
            </div>
            <p className="text-sm text-slate-500">Average Rating</p>
            <p className="mt-1 flex items-center gap-2 text-3xl font-bold">
              {overallAverage.toFixed(1)}
              <Star size={22} className="fill-amber-400 text-amber-400" />
            </p>
          </div>
        </section>

        {loading ? (
          <div className="rounded-xl border bg-white p-10 text-center text-slate-500">
            Loading owner dashboard...
          </div>
        ) : (
          <>
            <section className="mb-8">
              <h3 className="mb-4 text-xl font-bold">My Stores</h3>

              {dashboard.length === 0 ? (
                <div className="rounded-xl border bg-white p-8 text-center text-slate-500">
                  No stores are assigned to your account yet.
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {dashboard.map((store) => {
                    const storeId = store.id ?? store.storeId;
                    const average = Number(
                      store.averageRating ?? store.average_rating ?? 0
                    );
                    const count = Number(
                      store.totalRatings ?? store.total_ratings ?? 0
                    );

                    return (
                      <article
                        key={storeId}
                        className="rounded-2xl border bg-white p-6 shadow-sm"
                      >
                        <h4 className="text-lg font-bold">{store.name}</h4>
                        <p className="mt-1 text-sm text-slate-500">
                          {store.address}
                        </p>
                        <div className="mt-5 flex items-center justify-between border-t pt-4">
                          <div>
                            <p className="text-sm text-slate-500">
                              Average rating
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-xl font-bold">
                              <Star
                                size={18}
                                className="fill-amber-400 text-amber-400"
                              />
                              {average.toFixed(1)} / 5
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-500">
                              Total ratings
                            </p>
                            <p className="mt-1 text-xl font-bold">{count}</p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-4 text-xl font-bold">Customer Ratings</h3>

              {ratings.length === 0 ? (
                <div className="rounded-xl border bg-white p-8 text-center text-slate-500">
                  No customer ratings yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-5 py-4 font-semibold">Customer</th>
                        <th className="px-5 py-4 font-semibold">Store</th>
                        <th className="px-5 py-4 font-semibold">Rating</th>
                        <th className="px-5 py-4 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {ratings.map((item, index) => {
                        const rating = Number(item.rating ?? 0);
                        const date = item.updated_at ?? item.updatedAt ??
                          item.created_at ?? item.createdAt;

                        return (
                          <tr key={item.id ?? index} className="hover:bg-slate-50">
                            <td className="px-5 py-4">
                              <p className="font-semibold">
                                {item.userName ?? item.user_name ?? item.name ?? "Customer"}
                              </p>
                              <p className="mt-1 text-slate-500">
                                {item.userEmail ?? item.user_email ?? item.email ?? ""}
                              </p>
                            </td>
                            <td className="px-5 py-4">
                              {item.storeName ?? item.store_name ?? "—"}
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 font-semibold text-amber-700">
                                <Star size={14} className="fill-amber-400 text-amber-400" />
                                {rating}/5
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-500">
                              {date ? new Date(date).toLocaleDateString() : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
