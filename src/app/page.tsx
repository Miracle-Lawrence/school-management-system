import Image from "next/image";
import Link from "next/link";

const services = [
  {
    number: "01",
    title: "Website Design & Development",
    description:
      "Beautiful, responsive and high-performing websites that communicate your brand, engage visitors and turn ideas into opportunities.",
    tags: ["Business Websites", "Portfolio Websites", "E-commerce"],
  },
  {
    number: "02",
    title: "Web Applications & Software",
    description:
      "Purpose-built digital platforms that simplify operations, solve business challenges and help organisations work smarter.",
    tags: ["Custom Web Apps", "SaaS Platforms", "Business Systems"],
  },
  {
    number: "03",
    title: "Website Maintenance",
    description:
      "Keep your digital presence reliable with regular updates, performance improvements, technical support and ongoing care.",
    tags: ["Updates", "Performance", "Technical Support"],
  },
  {
    number: "04",
    title: "Website Security",
    description:
      "Protect your website and digital assets through security-conscious development, monitoring and preventive maintenance.",
    tags: ["Security Audits", "Protection", "Best Practices"],
  },
];

const values = [
  {
    title: "Purpose-driven solutions",
    description:
      "We begin with your goals and build technology around the real problems you need to solve.",
  },
  {
    title: "Quality in every detail",
    description:
      "From the first design to the final deployment, we care about usability, performance and reliability.",
  },
  {
    title: "Partnership beyond launch",
    description:
      "We believe good technology deserves continued attention, support and room to grow.",
  },
];

export default async function Home({ searchParams }: { searchParams: Promise<{ contact?: string }> }) {
  const { contact } = await searchParams;
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
    <Link href="#home" aria-label="MLOEXA Studio home" className="shrink-0">
      <Image
        src="/images/mloexa-logo.png"
        alt="MLOEXA Studio"
        width={220}
        height={110}
        priority
        className="h-14 w-auto object-contain"
      />
    </Link>

    <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
      <a href="#home" className="transition hover:text-teal-600">Home</a>
      <a href="#services" className="transition hover:text-teal-600">Services</a>
      <a href="#about" className="transition hover:text-teal-600">About Us</a>
      <a href="#contact" className="transition hover:text-teal-600">Contact Us</a>
    </nav>

    <a
      href="#contact"
      className="hidden rounded-full bg-[#102b50] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/10 transition hover:bg-teal-600 md:inline-flex"
    >
      Start a Project <span aria-hidden="true">↗</span>
    </a>

    <details className="group relative md:hidden">
      <summary
        aria-label="Toggle navigation menu"
        className="flex h-11 w-11 cursor-pointer list-none flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-[#102b50] transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden"
      >
        <span className="h-0.5 w-5 rounded-full bg-current"></span>
        <span className="h-0.5 w-5 rounded-full bg-current"></span>
        <span className="h-0.5 w-5 rounded-full bg-current"></span>
      </summary>

      <nav className="absolute right-0 top-14 z-50 flex w-64 flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
        <a href="#home" className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-teal-600">Home</a>
        <a href="#services" className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-teal-600">Services</a>
        <a href="#about" className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-teal-600">About Us</a>
        <a href="#contact" className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-teal-600">Contact Us</a>
        <a href="#contact" className="mt-2 rounded-full bg-[#102b50] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-teal-600">
          Start a Project ↗
        </a>
      </nav>
    </details>
  </div>
</header>

      <section
        id="home"
        className="relative isolate scroll-mt-24 overflow-hidden bg-[#091a33] text-white"
      >
        <div className="absolute -right-40 -top-40 -z-10 h-[550px] w-[550px] rounded-full bg-teal-400/20 blur-[120px]" />
        <div className="absolute -bottom-60 -left-40 -z-10 h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[1.1fr_0.9fr] lg:py-36">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-teal-300/30 bg-teal-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-teal-200">
              <span className="h-2 w-2 rounded-full bg-teal-300" />
              Digital solutions. Real impact.
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-[1.12] tracking-tight sm:text-5xl lg:text-7xl">
              We turn bold ideas into{" "}
              <span className="bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">
                digital experiences.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              MLOEXA STUDIO helps businesses and organisations build a stronger
              digital presence through thoughtful website design, custom
              software development, maintenance and security.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#contact"
                className="rounded-full bg-teal-400 px-7 py-4 text-sm font-extrabold text-[#09213a] shadow-xl shadow-teal-950/20 transition hover:-translate-y-1 hover:bg-teal-300"
              >
                Let's Build Something <span aria-hidden="true">↗</span>
              </a>
              <a
                href="#services"
                className="rounded-full border border-white/25 px-7 py-4 text-sm font-bold text-white transition hover:border-teal-300 hover:bg-white/5"
              >
                Explore Our Services
              </a>
            </div>

            <div className="mt-14 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-7 text-sm text-slate-300">
              <span><strong className="text-white">01.</strong> Understand</span>
              <span><strong className="text-white">02.</strong> Design</span>
              <span><strong className="text-white">03.</strong> Develop</span>
              <span><strong className="text-white">04.</strong> Support</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-teal-400/30 to-blue-500/20 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/15 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-300" />
                </div>
                <span className="text-xs font-medium tracking-widest text-slate-400">
                  MLOEXA / DIGITAL STUDIO
                </span>
              </div>

              <div className="flex min-h-[330px] flex-col justify-between py-8 sm:min-h-[390px]">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-teal-300">
                    Your vision, engineered
                  </p>
                  <h2 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
                    Think it.
                    <br />
                    Build it.
                    <br />
                    <span className="text-teal-300">Make it real.</span>
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <span className="text-2xl text-teal-300">⌘</span>
                    <p className="mt-3 text-sm font-bold">Creative design</p>
                    <p className="mt-1 text-xs text-slate-400">Built around people</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <span className="text-2xl text-teal-300">{"</>"}</span>
                    <p className="mt-3 text-sm font-bold">Smart development</p>
                    <p className="mt-1 text-xs text-slate-400">Made to perform</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-7 -left-5 hidden rounded-2xl border border-teal-200/20 bg-[#102b50] px-5 py-4 shadow-xl sm:block">
              <p className="text-xs font-semibold text-teal-200">OUR COMMITMENT</p>
              <p className="mt-1 text-sm font-bold text-white">Quality. Creativity. Reliability.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 sm:px-8 md:grid-cols-3">
          {[
            ["Web design", "Digital experiences that represent your brand."],
            ["Software solutions", "Technology that supports how you work."],
            ["Maintenance & security", "Ongoing care for your digital assets."],
          ].map(([title, description]) => (
            <div key={title} className="flex items-start gap-4">
              <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 font-bold text-teal-700">
                ✓
              </span>
              <div>
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-teal-700">
              What we do
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#102b50] sm:text-5xl">
              Digital services designed around your ambitions.
            </h2>
            <p className="mt-5 leading-8 text-slate-600">
              Whether you are starting from scratch or improving an existing
              platform, we bring design, technology and practical thinking
              together to help you move forward.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {services.map((service) => (
              <article
                key={service.number}
                className="group rounded-3xl border border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl hover:shadow-slate-200/60 sm:p-9"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black tracking-widest text-teal-700">
                    {service.number}
                  </span>
                  <span className="text-2xl text-slate-300 transition group-hover:text-teal-600">
                    ↗
                  </span>
                </div>
                <h3 className="mt-8 text-xl font-extrabold text-[#102b50] sm:text-2xl">
                  {service.title}
                </h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                  {service.description}
                </p>
                <div className="mt-7 flex flex-wrap gap-2">
                  {service.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f3f7fa] px-5 py-24 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-teal-700">
              How we work
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#102b50] sm:text-5xl">
              More than a website. A partner in your growth.
            </h2>
            <p className="mt-6 leading-8 text-slate-600">
              Every organisation has a different story, audience and set of
              challenges. We take time to understand yours before recommending
              and building the right digital solution.
            </p>
            <a
              href="#contact"
              className="mt-8 inline-flex items-center gap-3 font-bold text-teal-800 transition hover:gap-5"
            >
              Tell us what you are building <span>→</span>
            </a>
          </div>

          <div className="space-y-4">
            {values.map((value, index) => (
              <div key={value.title} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
                <div className="flex gap-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#102b50] text-sm font-black text-teal-300">
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-[#102b50]">{value.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{value.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-teal-700">
              About MLOEXA
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#102b50] sm:text-5xl">
              Technology with purpose. Creativity with direction.
            </h2>
            <p className="mt-5 leading-8 text-slate-600">
              MLOEXA STUDIO is a digital solutions studio focused on helping
              businesses and organisations establish, improve and maintain
              their digital presence. We combine thoughtful design with
              practical development to create solutions that serve real needs.
            </p>
          </div>

          <div className="mt-14 grid items-center gap-12 rounded-[2rem] bg-[#091a33] p-6 text-white sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:p-14">
            <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-800">
              <Image
                src="/images/ceo-miracle.jpg"
                alt="Miracle Lawrence, CEO of MLOEXA Studio"
                width={900}
                height={1200}
                className="h-auto w-full object-cover"
              />
            </div>

            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-teal-300">
                A message from our CEO
              </p>
              <h3 className="mt-5 text-3xl font-black sm:text-4xl">
                Building useful technology, one idea at a time.
              </h3>
              <p className="mt-6 leading-8 text-slate-300">
                At MLOEXA STUDIO, our belief is simple: technology should make
                things better. It should help businesses communicate, operate
                efficiently and reach more people. My goal is to bring ideas to
                life through well-designed websites and dependable software
                solutions that create meaningful value.
              </p>
              <div className="mt-8 border-t border-white/15 pt-6">
                <p className="text-xl font-extrabold">Miracle Lawrence</p>
                <p className="mt-1 text-sm font-semibold text-teal-300">
                  Founder & Chief Executive Officer
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-400">
                  MLOEXA STUDIO
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-24 bg-[#f3f7fa] px-5 py-24 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-teal-700">
              Let's talk
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#102b50] sm:text-5xl">
              Have an idea? Let's make it happen.
            </h2>
            <p className="mt-6 leading-8 text-slate-600">
              Tell us a little about your project, business or digital
              challenge. We'd love to understand what you have in mind and
              explore how we can help.
            </p>
            <div className="mt-9 rounded-2xl border border-teal-200 bg-white p-5">
              <p className="text-sm font-bold text-[#102b50]">MLOEXA STUDIO</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Website design & development
                <br />
                Maintenance & security
                <br />
                Custom digital solutions
              </p>
            </div>
          </div>

          <form action="/api/contact" method="POST" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-9">
            <h3 className="text-xl font-extrabold text-[#102b50]">Send us an enquiry</h3>
            <p className="mt-2 text-sm text-slate-500">
              Share your details and a brief description of what you need.
            </p>

            {contact === "success" && (
              <div role="status" className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
                Thank you! Your enquiry has been submitted successfully. We will get back to you soon.
              </div>
            )}

            {contact === "error" && (
              <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
                We could not submit your enquiry. Please check your details and try again.
              </div>
            )}

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Full name
                <input name="name" required maxLength={100} autoComplete="name" placeholder="Your name" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-normal outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10" />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Email address
                <input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-normal outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10" />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Phone number <span className="font-normal text-slate-400">(optional)</span>
                <input name="phone" type="tel" maxLength={30} autoComplete="tel" placeholder="Your phone number" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-normal outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10" />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Service
                <select name="service" required defaultValue="" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-normal outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10">
                  <option value="" disabled>Select a service</option>
                  <option>Website Design & Development</option>
                  <option>Web Application & Software</option>
                  <option>Website Maintenance</option>
                  <option>Website Security</option>
                  <option>Other / Not Sure Yet</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                Tell us about your project
                <textarea name="message" required minLength={10} maxLength={5000} rows={5} placeholder="What would you like us to help you build?" className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-normal outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10" />
              </label>
            </div>

            <button type="submit" className="mt-6 w-full rounded-xl bg-[#102b50] px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-950/10 transition hover:bg-teal-700">
              Submit Enquiry <span aria-hidden="true">↗</span>
            </button>
            <p className="mt-4 text-center text-xs leading-5 text-slate-400">
              Your information will only be used to respond to your enquiry.
            </p>
          </form>
        </div>
      </section>

      <footer className="bg-[#07162b] px-5 py-10 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <Image
              src="/images/mloexa-logo.png"
              alt="MLOEXA Studio"
              width={150}
              height={75}
              className="h-12 w-auto rounded-lg object-contain"
            />
            <div>
              <p className="font-extrabold tracking-wide">MLOEXA STUDIO</p>
              <p className="mt-1 text-xs text-slate-400">Ideas into digital experiences.</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-5 text-sm text-slate-400">
            <a href="#home" className="transition hover:text-teal-300">Home</a>
            <a href="#services" className="transition hover:text-teal-300">Services</a>
            <a href="#about" className="transition hover:text-teal-300">About</a>
            <a href="#contact" className="transition hover:text-teal-300">Contact</a>
          </div>
          <p className="text-center text-xs text-slate-500">
            © {new Date().getFullYear()} MLOEXA STUDIO. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}




