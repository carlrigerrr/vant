import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircleIcon,
    MenuIcon,
    XIcon,
    CameraIcon,
    ClockIcon,
    UserGroupIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    ChatIcon,
    LightningBoltIcon
} from '@heroicons/react/outline';
import logo from './../../logos/logo__full-color.svg';

const LandingPage = () => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Vant Brand Colors matched to index.css
    // Primary: #1362FC (blue-600 approx)
    // Background: #F2F4FA (gray-50 approx)

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setMobileMenuOpen(false);
    };

    return (
        <div className="font-sans text-gray-900 bg-[#F2F4FA] min-h-screen">

            {/* NAVIGATION */}
            <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex-shrink-0 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                            <img src={logo} alt="Vant" className="h-10 w-auto" />
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex space-x-8 items-center">
                            <button onClick={() => scrollToSection('problem')} className="text-gray-600 hover:text-[#1362FC] font-medium transition">Why Vant?</button>
                            <button onClick={() => scrollToSection('solution')} className="text-gray-600 hover:text-[#1362FC] font-medium transition">Features</button>
                            <button onClick={() => scrollToSection('pricing')} className="text-gray-600 hover:text-[#1362FC] font-medium transition">Pricing</button>
                            <button
                                onClick={() => navigate('/login')}
                                className="text-[#1362FC] font-semibold hover:bg-blue-50 px-4 py-2 rounded-lg transition"
                            >
                                Log In
                            </button>
                            <button
                                className="bg-[#1362FC] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5"
                            >
                                Book a Walkthrough
                            </button>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="text-gray-600 hover:text-gray-900 p-2"
                            >
                                {mobileMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-6 shadow-xl">
                        <div className="flex flex-col space-y-4 mt-4">
                            <button onClick={() => scrollToSection('problem')} className="text-left text-gray-600 font-medium py-2">Why Vant?</button>
                            <button onClick={() => scrollToSection('solution')} className="text-left text-gray-600 font-medium py-2">Features</button>
                            <button onClick={() => navigate('/login')} className="text-left text-[#1362FC] font-semibold py-2">Log In</button>
                            <button className="bg-[#1362FC] text-white px-5 py-3 rounded-xl font-semibold w-full text-center">
                                Book a Walkthrough
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            {/* HERO SECTION */}
            <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 relative overflow-hidden">
                {/* Background blobs */}
                <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-cyan-100 rounded-full blur-3xl opacity-50"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-[#1362FC] text-sm font-semibold mb-8 border border-blue-100 animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        New: Vant v1.0 is here
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-[#3d4465] mb-8 leading-[1.1]">
                        Run your cleaning business without <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1362FC] to-cyan-400">daily admin chaos</span>
                    </h1>

                    <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Scheduling, client info, proof-of-work photos, and invoicing —
                        built for small cleaning teams (5–20 staff) who are tired of WhatsApp & spreadsheets.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="w-full sm:w-auto bg-[#1362FC] hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-blue-200 transition-all transform hover:-translate-y-1">
                            See how it works (10m)
                        </button>
                        <button className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-8 py-4 rounded-xl font-semibold text-lg transition-all">
                            Is this right for me?
                        </button>
                    </div>
                    <p className="mt-4 text-sm text-gray-400">
                        No credit card • No obligation • Built for small teams
                    </p>

                    {/* Hero Image / Dashboard Preview Placeholder */}
                    <div className="mt-16 relative mx-auto max-w-5xl rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden bg-white">
                        <div className="absolute top-0 w-full h-8 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        {/* Mock UI Representation */}
                        <div className="pt-8 pb-12 px-8 bg-white grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="col-span-2 space-y-4">
                                <div className="h-8 w-1/3 bg-gray-100 rounded"></div>
                                <div className="h-32 w-full bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2">
                                            <div className="h-4 w-32 bg-blue-200 rounded"></div>
                                            <div className="h-3 w-24 bg-blue-100 rounded"></div>
                                        </div>
                                        <div className="h-6 w-16 bg-green-100 text-green-700 text-xs rounded full flex items-center justify-center font-bold">In Progress</div>
                                    </div>
                                    <div className="mt-8 flex gap-2">
                                        <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white ring-1 ring-gray-100"></div>
                                        <div className="h-8 w-8 rounded-full bg-gray-300 border-2 border-white ring-1 ring-gray-100 -ml-2"></div>
                                    </div>
                                </div>
                                <div className="h-32 w-full bg-gray-50 border border-gray-100 rounded-xl"></div>
                            </div>
                            <div className="col-span-1 space-y-4">
                                <div className="h-64 w-full bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400">
                                    <CameraIcon className="w-12 h-12 mb-2 opacity-50" />
                                    <span className="text-sm">Live Photo Feed</span>
                                </div>
                            </div>
                        </div>
                        {/* Glossy overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none"></div>
                    </div>
                </div>
            </section>

            {/* PROBLEM SECTION */}
            <section id="problem" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-block px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm font-semibold mb-6">
                                The Struggle
                            </div>
                            <h2 className="text-4xl font-bold text-[#3d4465] mb-6 leading-tight">
                                The work isn’t the problem — <span className="text-red-500">the admin is.</span>
                            </h2>
                            <p className="text-lg text-gray-500 mb-8">
                                Running a cleaning business shouldn't mean:
                            </p>

                            <ul className="space-y-4">
                                {[
                                    "Endless WhatsApp messages & ignored texts",
                                    "Manually checking schedules every night",
                                    "Answering the same client questions again & again",
                                    "Arguing with clients about “what was cleaned”",
                                    "Sending invoices late & chasing payments"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <XIcon className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-700 font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <p className="mt-6 text-lg font-medium text-red-500">
                                All of this steals time, energy, and growth from the business.
                            </p>

                            <div className="mt-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="font-semibold text-gray-900 border-l-4 border-blue-500 pl-4 py-1">
                                    "Most owners don’t need more software. They need clarity."
                                </p>
                            </div>
                        </div>

                        <div className="relative">
                            {/* Messy visual representation */}
                            <div className="absolute -inset-4 bg-red-50 rounded-[2rem] transform rotate-3"></div>
                            <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-gray-100 space-y-4">
                                {/* Chat Bubble 1 */}
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-none max-w-[80%]">
                                        <p className="text-sm text-gray-700">Where are the keys for the Smith house?? I'm outside!</p>
                                    </div>
                                </div>
                                {/* Chat Bubble 2 */}
                                <div className="flex justify-end">
                                    <div className="bg-blue-500 text-white px-4 py-3 rounded-2xl rounded-tr-none max-w-[80%]">
                                        <p className="text-sm">Check the email I sent last week...</p>
                                    </div>
                                </div>
                                {/* Chat Bubble 3 */}
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-none max-w-[80%]">
                                        <p className="text-sm text-gray-700">Client says the bathroom wasn't touched. Did you clean it?</p>
                                    </div>
                                </div>
                                {/* Chat Bubble 4 */}
                                <div className="flex justify-end">
                                    <div className="bg-blue-500 text-white px-4 py-3 rounded-2xl rounded-tr-none max-w-[80%]">
                                        <p className="text-sm">Yes! I definitely did.</p>
                                    </div>
                                </div>
                                <div className="text-center pt-2">
                                    <span className="text-xs text-red-400 font-semibold tracking-wide uppercase">Chaos Mode</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SOLUTION SECTION */}
            <section id="solution" className="py-24 bg-[#F2F4FA] relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-4xl font-bold text-[#3d4465] mb-6">
                            One simple system that <br className="hidden md:block" /> brings everything together
                        </h2>
                        <p className="text-lg text-gray-500">
                            No spreadsheets. No message chaos. Just a single weekly schedule you can trust.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: <ClockIcon className="w-8 h-8 text-blue-600" />,
                                title: "Know who's working — in one glance",
                                desc: "Weekly view, drag & drop assignments, multi-staff shifts."
                            },
                            {
                                icon: <ShieldCheckIcon className="w-8 h-8 text-purple-600" />,
                                title: "Stop answering the same questions",
                                desc: "Stored once. Codes, pets, preferences always accessible to staff."
                            },
                            {
                                icon: <UserGroupIcon className="w-8 h-8 text-green-600" />,
                                title: "Eliminate 'I didn't know' excuses",
                                desc: "Everyone knows exactly where to be and what to do."
                            },
                            {
                                icon: <DocumentTextIcon className="w-8 h-8 text-amber-600" />,
                                title: "Get paid faster without the chase",
                                desc: "Invoices created and sent automatically when work is marked done."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                                <div className="p-3 bg-gray-50 rounded-xl w-fit mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-500">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* DIFFERENTIATOR / POWER FEATURE */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-br from-[#1362FC] to-cyan-600 rounded-[2.5rem] p-8 md:p-16 text-white overflow-hidden relative shadow-2xl">
                        {/* Background pattern */}
                        <div className="absolute top-0 right-0 w-full h-full opacity-10">
                            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid)" />
                            </svg>
                        </div>

                        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium mb-6">
                                    <CameraIcon className="w-4 h-4" /> Power Feature
                                </div>
                                <h2 className="text-3xl md:text-5xl font-bold mb-6 !text-white">
                                    Proof of work — <br />without chasing photos
                                </h2>
                                <p className="text-lg text-blue-100 mb-8 leading-relaxed">
                                    Before starting a job, cleaners take a quick photo. After finishing, they take another.
                                    <br /><br />
                                    <strong>Vant automatically sends these to:</strong>
                                </p>
                                <ul className="space-y-3 mb-10">
                                    <li className="flex items-center gap-3 text-lg">
                                        <CheckCircleIcon className="w-6 h-6 text-cyan-300" /> The Client
                                    </li>
                                    <li className="flex items-center gap-3 text-lg">
                                        <CheckCircleIcon className="w-6 h-6 text-cyan-300" /> You or your manager
                                    </li>
                                </ul>
                                <p className="text-white font-bold text-lg mb-6">
                                    This alone saves most owners hours of back-and-forth every week.
                                </p>
                                <p className="text-white/80 italic">
                                    "So when a client has a question, you don’t argue — you simply share the proof."
                                </p>
                            </div>

                            <div className="relative">
                                {/* Phone Mockup Cards */}
                                <div className="bg-white text-gray-900 rounded-3xl p-4 shadow-2xl max-w-sm mx-auto transform rotate-2 hover:rotate-0 transition-transform duration-500">
                                    <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">JD</div>
                                            <div>
                                                <p className="font-bold text-sm">John Doe</p>
                                                <p className="text-xs text-gray-500">Just now</p>
                                            </div>
                                        </div>
                                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">Completed</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div className="bg-gray-100 rounded-lg h-32 flex items-center justify-center text-gray-400 text-xs">Before Photo</div>
                                        <div className="bg-gray-100 rounded-lg h-32 flex items-center justify-center text-gray-400 text-xs">After Photo</div>
                                    </div>
                                    <p className="text-sm text-gray-600 italic">"Living room deep clean complete. Noticed a scratch on the hardwood near the sofa (documented in before photo)."</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* POSITIONING / WHY VANT */}
            <section className="py-24 bg-[#F2F4FA]">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-[#3d4465] mb-6">
                        Built for small cleaning teams — <span className="text-gray-400">not big corporations</span>
                    </h2>
                    <p className="text-xl text-gray-500 mb-12">
                        Vant is designed for owner-led cleaning businesses where the owner still does the admin.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 text-left">
                        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <LightningBoltIcon className="w-5 h-5 text-amber-500" /> Focus on Today
                            </h3>
                            <p className="text-gray-500">
                                You only see what you need right now. A clean dashboard that puts today's schedule and issues front and center.
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <TrendingUpIcon className="w-5 h-5 text-green-500" /> Grows With You
                            </h3>
                            <p className="text-gray-500">
                                As your team grows, unlocked features appear. Start simple, scale up without switching software. No unnecessary complexity.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* TRUST / PARTNERSHIP */}
            <section className="py-20 bg-white border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="mx-auto w-16 h-1 w-16 bg-[#1362FC] rounded-full mb-8"></div>
                    <h2 className="text-3xl font-bold text-[#3d4465] mb-6">More than software — a long-term system</h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
                        We don’t just give you software and disappear. We help you set it up properly, reduce admin stress, and adapt the system as your business grows.
                        <br /><br />
                        <span className="font-semibold text-[#1362FC]">You’re not left alone with a tool.</span>
                    </p>

                    <div className="flex flex-wrap justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Placeholders for logos if needed */}
                        <div className="text-xl font-bold text-gray-400">BUILT WITH REAL CLEANING BUSINESSES</div>
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-24 bg-[#1362FC] text-white text-center">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8 !text-white">
                        Want to see if Vant fits your business?
                    </h2>
                    <button className="bg-white text-[#1362FC] px-10 py-5 rounded-2xl font-bold text-xl shadow-xl hover:bg-gray-50 transform hover:-translate-y-1 transition-all">
                        Book a short walkthrough
                    </button>
                    <p className="mt-8 text-blue-200 text-sm">No credit card required · Free 14-day trial available</p>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="text-white font-bold text-2xl tracking-tight">Vant.</div>
                    </div>
                    <div className="text-sm">
                        &copy; {new Date().getFullYear()} Vant Field Management. All rights reserved.
                    </div>
                </div>
            </footer>

        </div>
    );
};

// Helper Icon for section
function TrendingUpIcon(props) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
    );
}

export default LandingPage;
