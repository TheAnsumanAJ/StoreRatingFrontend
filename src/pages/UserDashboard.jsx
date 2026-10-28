
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Star, LogOut, Store, RefreshCw } from "lucide-react";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext";

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ratings, setRatings] = useState({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(null);

  async function fetchStores(searchTerm = search) {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/user/stores", {
        params: { search: searchTerm },
      });

      const result = response.data?.data ?? response.data;
      const storeList = Array.isArray(result)
        ? result
        : result.stores ?? [];

      setStores(storeList);

      // Initialize the rating selector from each user's saved rating.
      setRatings((previous) => {
        const next = { ...previous };

        storeList.forEach((store) => {
          const id = store.id ?? store.storeId;
          const ownRating = store.myRating ?? store.userRating;

          if (id != null && ownRating != null && next[id] == null) {
            next[id] = Number(ownRating);
          }
        });

        return next;
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load stores. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStores("");
  }, []);

  async function submitRating(store) {
    const storeId = store.id ?? store.storeId;
    const rating = Number(ratings[storeId]);

    if (!storeId || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      setMessage("Please select a rating from 1 to 5.");
      return;
    }

    try {
      setSubmitting(storeId);
      setMessage("");

      await api.post("/user/ratings", {
        storeId: Number(storeId),
        rating,
      });

      setMessage(`Your rating for ${store.name} was saved.`);
      await fetchStores();
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Unable to save your rating."
      );
    } finally {
      setSubmitting(null);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="flex items-center justify-between border-b bg-white px-5 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-100 p-2 text-violet-700">
            <Store size={23} />
          </div>
          <div>
            <h1 className="text-xl font-bold">RateWise</h1>
            <p className="text-xs text-slate-500">Store Directory</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold">{user?.name || "User"}</p>
            <p className="text-xs text-slate-500">Normal User</p>
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
        <section className="mb-8">
          <p className="mb-2 text-sm font-medium text-violet-700">
            YOUR STORE DISCOVERY
          </p>
          <h2 className="text-3xl font-bold tracking-tight">
            Discover and rate stores
          </h2>
          <p className="mt-2 text-slate-500">
            Explore stores, compare ratings, and share your experience.
          </p>
        </section>

        <section className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={19}
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") fetchStores(search);
              }}
              placeholder="Search by store name or address..."
              className="w-full rounded-xl border bg-white py-3 pl-10 pr-4 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <button
            onClick={() => fetchStores(search)}
            className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-medium text-white hover:bg-violet-700"
          >
            <Search size={18} />
            Search
          </button>
        </section>

        {message && (
          <div className="mb-5 rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Available Stores</h3>
          <span className="text-sm text-slate-500">
            {stores.length} {stores.length === 1 ? "store" : "stores"}
          </span>
        </div>

        {loading ? (
          <div className="rounded-xl border bg-white p-12 text-center text-slate-500">
            Loading stores...
          </div>
        ) : stores.length === 0 ? (
          <div className="rounded-xl border bg-white p-12 text-center">
            <Store className="mx-auto mb-3 text-slate-400" size={32} />
            <p className="font-medium">No stores found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try another search, or ask the administrator to add stores.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {stores.map((store) => {
              const storeId = store.id ?? store.storeId;
              const averageRating = Number(
                store.averageRating ?? store.average_rating ?? 0
              );
              const ownRating = store.myRating ?? store.userRating;

              return (
                <article
                  key={storeId}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
                      <Store size={22} />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 font-semibold">
                        <Star
                          size={17}
                          className="fill-amber-400 text-amber-400"
                        />
                        {averageRating > 0
                          ? averageRating.toFixed(1)
                          : "No ratings"}
                      </div>
                      <p className="text-xs text-slate-500">
                        Overall rating
                      </p>
                    </div>
                  </div>

                  <h4 className="text-lg font-bold">{store.name}</h4>
                  <p className="mt-1 break-words text-sm text-slate-500">
                    {store.address}
                  </p>
                  {store.email && (
                    <p className="mt-2 break-words text-sm text-slate-500">
                      {store.email}
                    </p>
                  )}

                  <div className="my-5 border-t" />

                  <p className="mb-2 text-sm font-semibold">
                    {ownRating != null
                      ? `Your current rating: ${ownRating}/5`
                      : "Rate this store"}
                  </p>

                  <div className="mb-4 flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-label={`Rate ${value} out of 5`}
                        title={`${value} star${value > 1 ? "s" : ""}`}
                        onClick={() =>
                          setRatings((previous) => ({
                            ...previous,
                            [storeId]: value,
                          }))
                        }
                        className="rounded p-1 transition hover:scale-110"
                      >
                        <Star
                          size={25}
                          className={
                            value <= Number(ratings[storeId] || 0)
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }
                        />
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => submitRating(store)}
                    disabled={submitting === storeId || !ratings[storeId]}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting === storeId ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : ownRating != null ? (
                      "Update Rating"
                    ) : (
                      "Submit Rating"
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
