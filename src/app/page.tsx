
"use client";

import { useState, type FormEvent } from "react";

type Page = "home" | "register" | "payment" | "student" | "teacher";

type Course = {
  id: string;
  title: string;
  image: string;
  description: string;
  price: number;
  startAt: string | null;
  endAt: string | null;
};

type Student = {
  name: string;
  email: string;
  phone: string;
};

type Enrollment = {
  courseId: string;
  reference: string;
  paidAt: string;
};

type ClassMaterial = {
  id: string;
  courseId: string;
  title: string;
  fileName: string;
  fileType: string;
  url: string;
  uploadedAt: string;
};

const COURSES: Course[] = [
  {
    id: "water",
    title: "Spirituality of Water",
    image: "/assets/water.png",
    description: "Explore the spiritual teachings and significance of water.",
    price: 750,
    startAt: null,
    endAt: null,
  },
  {
    id: "salt",
    title: "The Covenant of the Salt",
    image: "/assets/salt.png",
    description: "Explore the teachings and spiritual meaning of the covenant of salt.",
    price: 750,
    startAt: null,
    endAt: null,
  },
  {
    id: "number",
    title: "How to Calculate Your Name Number",
    image: "/assets/number.png",
    description: "Learn how to calculate and understand your name number.",
    price: 750,
    startAt: null,
    endAt: null,
  },
];

const ALLOWED_EXTENSIONS = [
  "mp4", "webm", "mov", "pdf", "txt", "doc", "docx", "ppt", "pptx",
];

const inputClass =
  "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

const buttonPrimary =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300";

function getStatus(course: Course) {
  if (!course.startAt || !course.endAt) return "Schedule to be announced";

  const now = Date.now();
  if (now < new Date(course.startAt).getTime()) return "Upcoming";
  if (now < new Date(course.endAt).getTime()) return "In progress";
  return "Completed";
}

function formatDate(value: string | null) {
  if (!value) return "Schedule to be announced";

  return new Date(value).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getScheduleConflict(courses: Course[]) {
  const scheduled = courses.filter((c) => c.startAt && c.endAt);

  for (let i = 0; i < scheduled.length; i++) {
    const a = scheduled[i];
    const aStart = new Date(a.startAt!).getTime();
    const aEnd = new Date(a.endAt!).getTime();

    if (!Number.isFinite(aStart) || !Number.isFinite(aEnd) || aEnd <= aStart) {
      return `The schedule for ${a.title} is invalid.`;
    }

    for (let j = i + 1; j < scheduled.length; j++) {
      const b = scheduled[j];
      const bStart = new Date(b.startAt!).getTime();
      const bEnd = new Date(b.endAt!).getTime();

      if (aStart < bEnd && bStart < aEnd) {
        return `${a.title} and ${b.title} have overlapping schedules.`;
      }
    }
  }

  return null;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 break-words text-xl font-bold sm:text-2xl">{value}</p>
    </div>
  );
}

export default function Home() {
  const [page, setPage] = useState<Page>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("water");
  const [student, setStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [materials, setMaterials] = useState<ClassMaterial[]>([]);
  const [notice, setNotice] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadCourseId, setUploadCourseId] = useState("water");
  const [materialTitle, setMaterialTitle] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const selectedCourse =
    COURSES.find((course) => course.id === selectedCourseId) ?? COURSES[0];

  const conflict = getScheduleConflict(COURSES);
  const enrolledCourseIds = enrollments.map((e) => e.courseId);

  function navigate(nextPage: Page) {
    setNotice("");
    setMobileMenuOpen(false);
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseCourse(courseId: string) {
    setSelectedCourseId(courseId);
    setNotice("");

    if (enrolledCourseIds.includes(courseId)) {
      navigate("student");
      return;
    }

    navigate("register");
  }

  function registerStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStudent({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    });

    navigate("payment");
  }

  function completePayment(success: boolean) {
    if (!student) {
      setNotice("Please complete your registration first.");
      setPage("register");
      return;
    }

    if (conflict) {
      setNotice("This class is temporarily unavailable.");
      return;
    }

    if (getStatus(selectedCourse) === "Completed") {
      setNotice("Registration for this class has closed.");
      return;
    }

    if (enrolledCourseIds.includes(selectedCourse.id)) {
      setNotice("You are already enrolled in this class.");
      setPage("student");
      return;
    }

    if (!success) {
      setNotice("Payment was unsuccessful. Please try again.");
      return;
    }

    setEnrollments((previous) => [
      ...previous,
      {
        courseId: selectedCourse.id,
        reference: `EPT-${Date.now().toString().slice(-8)}`,
        paidAt: new Date().toISOString(),
      },
    ]);

    setNotice("Your registration was successful.");
    setPage("student");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function uploadMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formElement = event.currentTarget;
    const fileInput = formElement.elements.namedItem(
      "materialFile",
    ) as HTMLInputElement | null;
    const file = fileInput?.files?.[0];

    if (!file) {
      setUploadMessage("Please select a file.");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setUploadMessage("Please choose a supported video, PDF, text, Word or PowerPoint file.");
      return;
    }

    if (file.size === 0) {
      setUploadMessage("The selected file is empty.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setUploadMessage("The file must be smaller than 100 MB.");
      return;
    }

    const material: ClassMaterial = {
      id: crypto.randomUUID(),
      courseId: uploadCourseId,
      title: materialTitle.trim() || file.name,
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
    };

    setMaterials((previous) => [material, ...previous]);
    setMaterialTitle("");
    setUploadMessage("Material uploaded successfully.");
    formElement.reset();
  }

  function removeMaterial(id: string) {
    const material = materials.find((item) => item.id === id);
    if (material) URL.revokeObjectURL(material.url);

    setMaterials((previous) => previous.filter((item) => item.id !== id));
    setUploadMessage("Material removed.");
  }

  function renderMaterials(courseId: string) {
    const courseMaterials = materials.filter((m) => m.courseId === courseId);

    if (courseMaterials.length === 0) {
      return <p className="mt-2 text-sm text-slate-500">No materials available yet.</p>;
    }

    return (
      <div className="mt-3 space-y-3">
        {courseMaterials.map((material) => (
          <div key={material.id} className="min-w-0 rounded-xl bg-slate-50 p-3 sm:p-4">
            <p className="break-words text-sm font-semibold">{material.title}</p>
            <p className="mt-1 break-all text-xs text-slate-500">{material.fileName}</p>

            {/\\.(mp4|webm|mov)$/i.test(material.fileName) ? (
              <video
                controls
                preload="metadata"
                className="mt-3 max-h-[420px] w-full rounded-lg bg-black"
                src={material.url}
              >
                Your browser does not support video playback.
              </video>
            ) : (
              <a
                href={material.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Open Notes / Download
              </a>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button onClick={() => navigate("home")} className="flex min-w-0 items-center gap-2.5 text-left sm:gap-3">
            <img
              src="/assets/el%20protos.png"
              alt="El Protos"
              className="h-10 w-10 shrink-0 rounded-full border border-amber-400 object-cover sm:h-12 sm:w-12"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold sm:text-base">El Protos Classes</span>
              <span className="block text-xs text-slate-500">Online Learning</span>
            </span>
          </button>

          <nav className="hidden items-center gap-5 md:flex">
            <button onClick={() => navigate("home")} className="text-sm text-slate-600 hover:text-indigo-600">Home</button>
            <button onClick={() => navigate("student")} className="text-sm text-slate-600 hover:text-indigo-600">My Classes</button>
            <button onClick={() => navigate("teacher")} className="text-sm text-slate-600 hover:text-indigo-600">Teacher Dashboard</button>
            <button onClick={() => navigate("home")} className={buttonPrimary}>Browse Classes</button>
          </nav>

          <button
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-xl md:hidden"
          >
            {mobileMenuOpen ? "×" : "☰"}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="space-y-1 border-t border-slate-200 bg-white p-3 md:hidden">
            {[
              ["Home", "home"],
              ["My Classes", "student"],
              ["Teacher Dashboard", "teacher"],
            ].map(([label, target]) => (
              <button
                key={target}
                onClick={() => navigate(target as Page)}
                className="block min-h-11 w-full rounded-lg px-4 py-3 text-left text-sm font-medium hover:bg-slate-50"
              >
                {label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:py-12">
        {notice && (
          <div role="status" className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
            {notice}
          </div>
        )}

        {page === "home" && (
          <>
            <section className="overflow-hidden rounded-3xl bg-slate-950 text-white">
              <div className="grid items-center gap-8 px-5 py-8 sm:px-8 sm:py-10 md:grid-cols-2 md:gap-10 md:px-12 md:py-14">
                <div>
                  <span className="inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-200">
                    Welcome to El Protos Classes
                  </span>
                  <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                    Discover. Learn. Grow.
                  </h1>
                  <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
                    Explore our classes, register online, and access your learning journey from one convenient place.
                  </p>
                  <button
                    onClick={() => document.getElementById("classes")?.scrollIntoView({ behavior: "smooth" })}
                    className="mt-6 min-h-12 rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-950 hover:bg-amber-300"
                  >
                    Explore Classes →
                  </button>
                </div>
                <div className="flex justify-center">
                  <img
                    src="/assets/el%20protos.png"
                    alt="El Protos"
                    className="aspect-square w-48 rounded-full border-4 border-amber-400 object-cover shadow-2xl sm:w-64 md:w-full md:max-w-sm"
                  />
                </div>
              </div>
            </section>

            <section id="classes" className="py-10 sm:py-14 md:py-16">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Explore Learning</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Our Classes</h2>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {COURSES.map((course) => {
                  const status = getStatus(course);
                  const alreadyEnrolled = enrolledCourseIds.includes(course.id);

                  return (
                    <article key={course.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-lg">
                      <img src={course.image} alt={course.title} className="h-52 w-full bg-slate-100 object-cover sm:h-56" />
                      <div className="flex flex-1 flex-col p-4 sm:p-6">
                        <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{status}</span>
                        <h3 className="mt-4 text-lg font-bold sm:text-xl">{course.title}</h3>
                        <p className="mt-3 flex-1 text-sm leading-6 text-slate-500">{course.description}</p>
                        <div className="mt-5 rounded-xl bg-slate-50 p-4">
                          <p className="text-xs text-slate-500">Class Schedule</p>
                          <p className="mt-1 text-sm font-medium">{formatDate(course.startAt)}</p>
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4">
                            <span className="text-xl font-bold">KSh {course.price.toLocaleString("en-KE")}</span>
                            <span className="text-xs text-slate-500">Online Class</span>
                          </div>
                        </div>
                        <button
                          disabled={status === "Completed" || alreadyEnrolled}
                          onClick={() => chooseCourse(course.id)}
                          className={`${buttonPrimary} mt-5 w-full`}
                        >
                          {alreadyEnrolled ? "Already Enrolled" : status === "Completed" ? "Class Completed" : "Enroll Now"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 pb-6 sm:grid-cols-3 sm:gap-5">
              {[
                ["01", "Choose Your Class", "Explore the classes and select your preferred course."],
                ["02", "Register Online", "Enter your details and complete registration."],
                ["03", "Start Learning", "Access your enrolled classes from your student portal."],
              ].map(([number, title, description]) => (
                <div key={number} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <span className="text-sm font-bold text-amber-600">{number}</span>
                  <h3 className="mt-3 font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
                </div>
              ))}
            </section>
          </>
        )}

        {page === "register" && (
          <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <button onClick={() => navigate("home")} className="text-sm font-medium text-indigo-600">← Back to Classes</button>
            <h1 className="mt-5 text-2xl font-bold sm:text-3xl">Student Registration</h1>
            <div className="mt-5 flex min-w-0 gap-3 rounded-xl bg-slate-50 p-3 sm:gap-4 sm:p-4">
              <img src={selectedCourse.image} alt={selectedCourse.title} className="h-20 w-24 shrink-0 rounded-lg object-cover sm:h-24 sm:w-28" />
              <div className="min-w-0">
                <p className="break-words font-bold">{selectedCourse.title}</p>
                <p className="mt-1 text-sm text-slate-500">{getStatus(selectedCourse)}</p>
                <p className="mt-1 font-semibold">KSh {selectedCourse.price.toLocaleString("en-KE")}</p>
              </div>
            </div>

            <form onSubmit={registerStudent} className="mt-6 space-y-4">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-semibold">Full Name</label>
                <input id="name" required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter your full name" className={inputClass} />
              </div>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold">Email Address</label>
                <input id="email" required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className={inputClass} />
              </div>
              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-semibold">M-Pesa Phone Number</label>
                <input id="phone" required type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="07XXXXXXXX" className={inputClass} />
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold">Password</label>
                <input id="password" required type="password" autoComplete="new-password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Create a password" className={inputClass} />
              </div>
              <button type="submit" className={`${buttonPrimary} w-full`}>Continue to Payment →</button>
            </form>
          </section>
        )}

        {page === "payment" && (
          <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <button onClick={() => navigate("register")} className="text-sm font-medium text-indigo-600">← Back to Registration</button>
            <h1 className="mt-5 text-2xl font-bold sm:text-3xl">Checkout</h1>
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <img src={selectedCourse.image} alt={selectedCourse.title} className="h-44 w-full object-cover sm:h-52" />
              <div className="p-4 sm:p-5">
                <h2 className="text-lg font-bold sm:text-xl">{selectedCourse.title}</h2>
                <p className="mt-2 break-words text-sm text-slate-500">Student: {student?.name}</p>
                <p className="mt-1 text-sm text-slate-500">Phone: {student?.phone}</p>
                <div className="my-5 border-t border-dashed border-slate-200" />
                <div className="flex justify-between gap-3 text-sm"><span className="text-slate-500">Class Fee</span><span>KSh {selectedCourse.price.toLocaleString("en-KE")}</span></div>
                <div className="mt-3 flex justify-between gap-3 text-lg font-bold"><span>Total</span><span>KSh {selectedCourse.price.toLocaleString("en-KE")}</span></div>
              </div>
            </div>
            <div className="mt-5 rounded-xl border border-slate-200 p-4">
              <h2 className="font-semibold">M-Pesa Payment</h2>
              <p className="mt-1 text-sm text-slate-500">Pay for {selectedCourse.title}</p>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button onClick={() => completePayment(true)} className={`${buttonPrimary} w-full bg-emerald-600 hover:bg-emerald-700`}>Confirm Payment</button>
              <button onClick={() => completePayment(false)} className="min-h-11 w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50">Cancel Payment</button>
            </div>
          </section>
        )}

        {page === "student" && (
          <section>
            <p className="text-sm font-semibold text-indigo-600">STUDENT PORTAL</p>
            <h1 className="mt-2 break-words text-2xl font-bold sm:text-3xl">{student ? `Welcome, ${student.name}` : "My Learning"}</h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">Manage your classes and view your payment history.</p>

            {!student ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center sm:p-8">
                <h2 className="font-semibold">Welcome to your student portal</h2>
                <p className="mt-2 text-sm text-slate-500">Browse our classes to get started.</p>
                <button onClick={() => navigate("home")} className={`${buttonPrimary} mt-5`}>Browse Classes</button>
              </div>
            ) : (
              <div className="mt-6 grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
                <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 lg:col-span-2">
                  <h2 className="text-xl font-bold">My Classes</h2>
                  {enrollments.length === 0 ? (
                    <div className="mt-4 rounded-xl bg-slate-50 p-5">
                      <p className="font-semibold">No classes enrolled yet</p>
                      <button onClick={() => navigate("home")} className={`${buttonPrimary} mt-4`}>Explore Classes</button>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {enrollments.map((enrollment) => {
                        const course = COURSES.find((c) => c.id === enrollment.courseId)!;
                        return (
                          <article key={enrollment.reference} className="min-w-0 rounded-xl border border-slate-200 p-3 sm:p-4">
                            <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
                              <img src={course.image} alt={course.title} className="h-40 w-full rounded-lg object-cover sm:h-24 sm:w-32" />
                              <div className="min-w-0">
                                <h3 className="break-words font-bold">{course.title}</h3>
                                <p className="mt-1 text-sm text-slate-500">{getStatus(course)}</p>
                                <p className="mt-2 text-sm font-semibold">KSh {course.price.toLocaleString("en-KE")}</p>
                                <p className="mt-1 break-all text-xs text-slate-500">Reference: {enrollment.reference}</p>
                                <p className="mt-1 text-xs text-slate-500">Schedule: {formatDate(course.startAt)}</p>
                              </div>
                            </div>
                            <div className="mt-4 border-t border-slate-200 pt-4">
                              <h4 className="font-semibold">Learning Materials</h4>
                              {renderMaterials(course.id)}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>

                <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                  <h2 className="text-xl font-bold">Payment History</h2>
                  <p className="mt-4 break-words text-2xl font-bold">KSh {(enrollments.length * 750).toLocaleString("en-KE")}</p>
                  <div className="mt-4 space-y-4">
                    {enrollments.map((enrollment) => {
                      const course = COURSES.find((c) => c.id === enrollment.courseId)!;
                      return (
                        <div key={enrollment.reference} className="border-t border-slate-100 pt-4">
                          <p className="break-words text-sm font-semibold">{course.title}</p>
                          <p className="mt-1 text-sm">KSh {course.price.toLocaleString("en-KE")}</p>
                          <p className="mt-1 text-xs text-slate-500">{new Date(enrollment.paidAt).toLocaleString("en-KE")}</p>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => navigate("home")} className="mt-5 min-h-11 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold">Enroll in Another Class</button>
                </aside>
              </div>
            )}
          </section>
        )}

        {page === "teacher" && (
          <section className="min-w-0">
            <p className="text-sm font-semibold text-indigo-600">ADMINISTRATION</p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Teacher Dashboard</h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">Manage classes, students, learning materials and payments.</p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              <StatCard label="Registered Students" value={student ? "1" : "0"} />
              <StatCard label="Enrollments" value={String(enrollments.length)} />
              <StatCard label="Payments" value={String(enrollments.length)} />
              <StatCard label="Total Revenue" value={`KSh ${(enrollments.length * 750).toLocaleString("en-KE")}`} />
            </div>

            <div className="mt-6 grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                <h2 className="text-xl font-bold">Class Schedule</h2>
                <div className="mt-4 space-y-3">
                  {COURSES.map((course) => (
                    <div key={course.id} className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:p-4">
                      <img src={course.image} alt={course.title} className="h-32 w-full rounded-lg object-cover sm:h-16 sm:w-20" />
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-semibold">{course.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{formatDate(course.startAt)}</p>
                        <p className="mt-1 text-xs text-slate-500">{enrollments.filter((e) => e.courseId === course.id).length} enrollment(s)</p>
                      </div>
                      <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{getStatus(course)}</span>
                    </div>
                  ))}
                </div>
                {conflict && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{conflict}</p>}
              </div>

              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                <h2 className="text-xl font-bold">Student Records</h2>
                {student ? (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <p className="break-words font-semibold">{student.name}</p>
                    <p className="mt-1 break-all text-sm text-slate-500">{student.email}</p>
                    <p className="mt-1 text-sm text-slate-500">{student.phone}</p>
                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Enrolled Classes</p>
                      {enrollments.length === 0 ? (
                        <p className="mt-2 text-sm">No enrollments yet</p>
                      ) : enrollments.map((enrollment) => {
                        const course = COURSES.find((c) => c.id === enrollment.courseId)!;
                        return <p key={enrollment.reference} className="mt-2 break-words text-sm">{course.title}</p>;
                      })}
                    </div>
                  </div>
                ) : <p className="mt-4 text-sm text-slate-500">No students registered yet.</p>}
              </div>
            </div>

            <section className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:mt-8 sm:p-6 md:p-8">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-bold sm:text-2xl">Learning Materials</h2>
                  <p className="mt-1 text-sm text-slate-500">Upload videos, notes, and presentations for your classes.</p>
                </div>
                <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{materials.length} material(s)</span>
              </div>

              <form onSubmit={uploadMaterial} className="mt-6 space-y-4 sm:mt-7 sm:space-y-5">
                <div>
                  <label htmlFor="uploadCourse" className="mb-2 block text-sm font-semibold">Select Class</label>
                  <select id="uploadCourse" value={uploadCourseId} onChange={(e) => setUploadCourseId(e.target.value)} className={inputClass}>
                    {COURSES.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="materialTitle" className="mb-2 block text-sm font-semibold">Material Title</label>
                  <input id="materialTitle" value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} placeholder="Enter a title for the material" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="materialFile" className="mb-2 block text-sm font-semibold">Choose Video or Notes</label>
                  <input
                    id="materialFile"
                    name="materialFile"
                    type="file"
                    required
                    accept=".mp4,.webm,.mov,.pdf,.txt,.doc,.docx,.ppt,.pptx"
                    className="block min-h-12 w-full min-w-0 rounded-xl border border-slate-200 p-2 text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:font-semibold file:text-indigo-700 sm:p-3 sm:file:mr-4 sm:file:px-4"
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-500">MP4, WebM, MOV, PDF, TXT, DOC, DOCX, PPT or PPTX. Maximum 100 MB.</p>
                </div>
                <button type="submit" className={`${buttonPrimary} w-full sm:w-auto`}>Upload Material</button>
                {uploadMessage && <p role="status" className="break-words rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{uploadMessage}</p>}
              </form>

              <div className="mt-7 border-t border-slate-200 pt-5 sm:mt-8 sm:pt-6">
                <h3 className="font-bold">Uploaded Materials</h3>
                <div className="mt-4 space-y-4">
                  {COURSES.map((course) => {
                    const courseMaterials = materials.filter((m) => m.courseId === course.id);
                    return (
                      <div key={course.id} className="min-w-0 rounded-xl border border-slate-200 p-3 sm:p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="break-words text-sm font-semibold sm:text-base">{course.title}</h4>
                          <span className="text-xs text-slate-500">{courseMaterials.length} file(s)</span>
                        </div>
                        {courseMaterials.length === 0 ? (
                          <p className="mt-3 text-sm text-slate-500">No materials uploaded.</p>
                        ) : (
                          <div className="mt-3 space-y-3">
                            {courseMaterials.map((material) => (
                              <div key={material.id} className="flex min-w-0 flex-col gap-3 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <p className="break-words text-sm font-medium">{material.title}</p>
                                  <p className="mt-1 break-all text-xs text-slate-500">{material.fileName}</p>
                                  <p className="mt-1 text-xs text-slate-500">{new Date(material.uploadedAt).toLocaleString("en-KE")}</p>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                  <a href={material.url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-600 sm:flex-none">View</a>
                                  <button type="button" onClick={() => removeMaterial(material.id)} className="min-h-10 flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 sm:flex-none">Remove</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </section>
        )}

        <footer className="mt-10 border-t border-slate-200 py-6 sm:mt-14 sm:py-7">
          <div className="flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 El Protos Classes</p>
            <p>All Rights Reserved</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
