import { FiAlertTriangle, FiArrowLeft, FiHome } from "react-icons/fi";
import {
  isRouteErrorResponse,
  Link,
  useNavigate,
  useRouteError,
} from "react-router-dom";

const ErrorPage = () => {
  const navigate = useNavigate();
  const error = useRouteError();

  const status = isRouteErrorResponse(error) ? error.status : 404;

  const isNotFound = status === 404;

  const title = isNotFound
    ? "Page Not Found"
    : "Something Went Wrong";

  const message = isNotFound
    ? "আপনি যে পেজটি খুঁজছেন, সেটি পাওয়া যায়নি অথবা পেজটির ঠিকানা পরিবর্তন হয়েছে।"
    : "দুঃখিত, পেজটি লোড করার সময় একটি সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।";

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl text-center">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-orange-100/50 px-6 py-10 sm:px-10 sm:py-14">
          
          {/* Error Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 border border-orange-100">
            <FiAlertTriangle className="text-4xl text-orange-500" />
          </div>

          {/* Error Code */}
          <h1 className="text-7xl sm:text-8xl font-black tracking-tight text-orange-500">
            {status}
          </h1>

          <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-900">
            {title}
          </h2>

          <p className="mt-4 text-sm sm:text-base leading-7 text-gray-500">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 active:scale-[0.98]"
            >
              <FiHome className="text-lg" />
              Back to Home
            </Link>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98]"
            >
              <FiArrowLeft className="text-lg" />
              Go Back
            </button>
          </div>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          প্রয়োজন হলে আমাদের সাপোর্ট টিমের সঙ্গে যোগাযোগ করুন।
        </p>
      </div>
    </main>
  );
};

export default ErrorPage;