import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppData } from '../context/AppContext';
import { Icon } from '@iconify/react';

const Home = () => {
  const { isAuth, logout } = AppData();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const features = [
    {
      icon: "codicon:zap",
      title: "Zero Setup Environment",
      desc: "Forget manual dependency installations and conflicting node versions. Spin up a fully containerized environment in seconds.",
    },
    {
      icon: "codicon:server-environment",
      title: "Cloud Compute Power",
      desc: "Offload intense compilations and heavy tasks to our cloud architecture. Keep your local laptop running cool and fast.",
    },
    {
      icon: "codicon:cloud-upload",
      title: "Continuously Synced",
      desc: "Your entire workspace syncs continuously. Switch devices seamlessly without ever relying on git pushes for uncommitted work.",
    },
    {
      icon: "codicon:device-mobile",
      title: "Access From Anywhere",
      desc: "If you have a browser, you have an IDE. Work effortlessly from a Chromebook, an iPad, or borrow a friend's PC.",
    }
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#050505] font-sans selection:bg-brand-cyan/30 selection:text-white">
      {/* Background Gradients */}
      <div 
        className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-purple/15 rounded-full mix-blend-screen blur-[120px] pointer-events-none"
      />
      <div 
        className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-cyan/15 rounded-full mix-blend-screen blur-[120px] pointer-events-none"
      />
      
      {/* Navbar Drop-in */}
      <nav 
        className="fixed w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-purple to-brand-cyan flex justify-center items-center font-bold text-white shadow-lg shadow-brand-cyan/20">W</div>
              <h1 className="text-xl font-bold tracking-tight text-white transition-opacity hover:opacity-80">WebIDE</h1>
            </div>
            <div className="flex items-center space-x-4 md:space-x-6">
              {isAuth ? (
                <>
                  <Link to="/dashboard" className="text-neutral-300 hover:text-white transition-colors font-medium text-sm hidden sm:block">Dashboard</Link>
                  <button
                    onClick={handleLogout}
                    className="glass-card px-5 py-2 rounded-full text-sm font-medium hover:bg-white/10 transition-colors text-white"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-neutral-300 hover:text-white transition-colors font-medium text-sm hidden sm:block">Sign In</Link>
                  <div>
                    <Link to="/register" className="btn-primary px-6 py-2.5 rounded-full text-sm">Start Coding Free</Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main 
        className="flex-1 flex flex-col justify-center relative z-10 pt-40 pb-24"
      >
        <div 
            className="max-w-5xl mx-auto px-6 sm:px-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-brand-cyan text-xs font-semibold tracking-wide uppercase mb-10 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <span 
              className="w-2 h-2 rounded-full bg-brand-cyan shadow-[0_0_8px_#06b6d4]"
            />
            Cloud Dev Environment v2.0
          </div>
          
          <h2 className="text-6xl sm:text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-neutral-500 tracking-tighter leading-[1.05] mb-8">
            Code anywhere.<br/>Build everywhere.
          </h2>
          
          <p className="mt-4 text-lg sm:text-xl md:text-2xl text-neutral-400 font-light max-w-2xl mx-auto leading-relaxed">
            A high-performance cloud development environment tailored for modern engineering teams. No configuration required.
          </p>
          
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-5">
            {isAuth ? (
              <div className="w-full sm:w-auto">
                  <Link to="/dashboard" className="btn-primary px-8 py-4 px-10 rounded-full text-lg shadow-[0_0_40px_rgba(6,182,212,0.3)] flex items-center gap-3 justify-center transition-all duration-300">
                    Launch Workspace
                    <Icon icon="codicon:arrow-right" className="w-5 h-5" />
                  </Link>
              </div>
            ) : (
              <>
                <div className="w-full sm:w-auto">
                    <Link to="/register" className="btn-primary px-10 py-4 rounded-full text-lg font-medium shadow-[0_0_40px_rgba(139,92,246,0.3)] text-center transition-all duration-300 flex items-center justify-center gap-2">
                    <Icon icon="codicon:terminal" className="w-5 h-5" />
                    Spin up an environment
                    </Link>
                </div>
                <div className="w-full sm:w-auto">
                    <Link to="/login" className="glass-card px-10 py-4 rounded-full text-lg font-medium hover:bg-white/10 transition-all duration-300 text-center flex items-center justify-center">
                    Sign In
                    </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Feature Display Graph / Editor Mockup */}
        <div 
            className="mt-28 px-6 relative w-full max-w-6xl mx-auto"
        >
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10 top-1/2"></div>
            
            <div 
                className="glass-card rounded-xl border border-white/10 shadow-2xl overflow-hidden hidden sm:block mx-auto transform shadow-brand-cyan/5 w-full max-w-4xl"
            >
                {/* Mockup Header */}
                <div className="bg-[#141414] border-b border-white/5 h-10 flex items-center px-4 gap-2 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    <div className="mx-auto bg-white/5 py-1 px-16 rounded text-[11px] uppercase font-bold tracking-wider text-neutral-500 flex items-center gap-2">
                        <Icon icon="codicon:repo" /> project-backend
                    </div>
                </div>
                {/* Mockup Body */}
                <div className="flex h-[400px] bg-[#0a0a0a]">
                    <div className="w-64 border-r border-white/5 bg-[#141414] p-4 hidden md:block">
                        <div className="h-4 w-2/3 bg-white/10 rounded mb-4"></div>
                        <div className="space-y-3">
                            <div className="h-3 w-4/5 bg-white/5 rounded"></div>
                            <div className="h-3 w-full bg-brand-cyan/20 rounded ml-4 border-l-2 border-brand-cyan"></div>
                            <div className="h-3 w-3/4 bg-white/5 rounded ml-4"></div>
                            <div className="h-3 w-5/6 bg-white/5 rounded"></div>
                        </div>
                    </div>
                    <div className="flex-1 p-8 font-mono text-sm leading-loose overflow-hidden relative">
                        <div>
                            <span className="text-brand-purple">import</span> <span className="text-white">{"{ "}express{" }"}</span> <span className="text-brand-purple">from</span> <span className="text-green-400">"express"</span>;
                        </div>
                        <div className="mt-2">
                            <span className="text-brand-purple">const</span> <span className="text-brand-cyan">app</span> = <span className="text-[#dcdcaa] font-bold">express</span>();
                        </div>
                        <div className="text-neutral-500 mt-4">
                            {"// Spin up massive container networks in 1 click."}
                        </div>
                        <div className="text-brand-cyan mt-2">
                            app.<span className="text-[#dcdcaa] font-bold">listen</span>(<span className="text-[#b5cea8]">8080</span>, () <span className="text-brand-purple">{'=>'}</span> {"{"}
                        </div>
                        <div className="ml-6 text-[#ce9178]">
                            console.<span className="text-[#dcdcaa] font-bold">log</span>(<span className="text-green-400">"🚀 Cloud Sandbox running securely on port 8080"</span>);
                        </div>
                        <div className="text-[#e5e5e5]">
                            {"});"}
                        </div>

                        {/* Floating visual elements */}
                        <div 
                            className="absolute right-12 top-20 bg-black/60 border border-brand-cyan/40 rounded-xl p-4 backdrop-blur-md shadow-2xl shadow-brand-cyan/20"
                        >
                            <div className="flex items-center gap-2 text-brand-cyan text-sm font-bold mb-1.5"><Icon icon="codicon:check-all" /> Real-time Sync Active</div>
                            <div className="text-xs text-neutral-400">Connected to Europe-West1</div>
                        </div>

                        <div 
                            className="absolute right-32 bottom-20 bg-black/60 border border-brand-purple/40 rounded-xl p-4 backdrop-blur-md shadow-2xl shadow-brand-purple/20"
                        >
                            <div className="flex items-center gap-2 text-brand-purple text-sm font-bold mb-1.5"><Icon icon="codicon:server" /> 16-Core Pre-warmed</div>
                            <div className="text-xs text-neutral-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> 0ms Latency</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>

      {/* Feature Comparisons */}
      <section className="relative z-10 w-full bg-black/60 border-t border-white/5 pt-32 pb-36">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
            
            <div 
              className="text-center max-w-3xl mx-auto mb-20"
            >
                <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400 mb-6 tracking-tight">Why upgrade to a Cloud IDE?</h3>
                <p className="text-neutral-400 text-xl leading-relaxed">Local setups are fragile, slow to build, and tightly bound to the hardware you're carrying. WebIDE shifts your burden to infinite cloud resources.</p>
            </div>

            <div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {features.map((feature, idx) => (
                    <div 
                        key={idx} 
                        className="group relative p-[1px] rounded-2xl overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="h-full bg-[#111]/80 backdrop-blur-sm p-8 rounded-2xl border border-white/5 hover:border-brand-purple/50 transition-colors duration-300 relative z-10 shadow-lg">
                            <div 
                                className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:bg-brand-purple/20 transition-all duration-300 shadow-inner"
                            >
                                <Icon icon={feature.icon} className="w-7 h-7 text-brand-cyan group-hover:text-brand-purple transition-colors duration-300" />
                            </div>
                            <h4 className="text-xl font-bold text-white mb-4 tracking-tight">{feature.title}</h4>
                            <p className="text-neutral-400 text-[15px] leading-relaxed">{feature.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="relative z-10 border-t border-white/5 bg-[#030303] py-20">
        <div 
            className="max-w-7xl mx-auto px-6 sm:px-8 text-center flex flex-col items-center"
        >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">Ready to start coding?</h2>
            {isAuth ? (
                <div>
                  <Link to="/dashboard" className="btn-primary px-10 py-4 rounded-full text-lg shadow-[0_0_30px_rgba(139,92,246,0.3)]">Head to Dashboard</Link>
                </div>
            ) : (
                <div>
                  <Link to="/register" className="btn-primary px-10 py-4 rounded-full text-lg shadow-[0_0_30px_rgba(139,92,246,0.3)]">Create a Free Account</Link>
                </div>
            )}
            <p className="mt-12 text-neutral-600 text-sm font-medium tracking-wide uppercase">© 2026 WebIDE. Designed for modern developers.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;