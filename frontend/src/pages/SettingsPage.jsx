import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppData } from "../context/AppContext";
import api from "../apiIntercepter";

export default function SettingsPage() {
  const { user, fetchUser } = AppData();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("editor");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [settings, setSettings] = useState({
    theme: user?.settings?.theme || "vs-dark",
    fontSize: user?.settings?.fontSize || 14,
    fontFamily: user?.settings?.fontFamily || "'Ubuntu Mono', monospace",
    tabSize: user?.settings?.tabSize || 2,
    lineNumbers: user?.settings?.lineNumbers ?? true,
    autoSave: user?.settings?.autoSave ?? true,
    multiTabs: user?.settings?.multiTabs ?? false,
    mouseWheelZoom: user?.settings?.mouseWheelZoom ?? false,
    stickyScroll: user?.settings?.stickyScroll ?? true,
    minimap: user?.settings?.minimap ?? false,
    bracketColorization: user?.settings?.bracketColorization ?? true,
    renderWhitespace: user?.settings?.renderWhitespace ?? false,
    formatOnSave: user?.settings?.formatOnSave ?? false,
    formatBeforeRun: user?.settings?.formatBeforeRun ?? false,
  });

  useEffect(() => {
    if (user?.settings) {
      setSettings({
        theme: user.settings.theme || "vs-dark",
        fontSize: user.settings.fontSize || 14,
        fontFamily: user.settings.fontFamily || "'Ubuntu Mono', monospace",
        tabSize: user.settings.tabSize || 2,
        lineNumbers: user.settings.lineNumbers ?? true,
        autoSave: user.settings.autoSave ?? true,
        multiTabs: user.settings.multiTabs ?? false,
        mouseWheelZoom: user.settings.mouseWheelZoom ?? false,
        stickyScroll: user.settings.stickyScroll ?? true,
        minimap: user.settings.minimap ?? false,
        bracketColorization: user.settings.bracketColorization ?? true,
        renderWhitespace: user.settings.renderWhitespace ?? false,
        formatOnSave: user.settings.formatOnSave ?? false,
        formatBeforeRun: user.settings.formatBeforeRun ?? false,
      });
    }
  }, [user]);

  const handleChange = (name, value) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await api.put("/api/v1/settings", settings);
      if (response.data) {
        setMessage({ type: "success", text: "Settings saved successfully!" });
        await fetchUser(); // Refresh global user data
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to save settings",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setDeleteLoading(true);
    try {
      await api.delete("/api/v1/account");
      localStorage.removeItem("hasLoggedOut");
      window.location.href = "/login";
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to delete account",
      });
      setShowDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }
    if (passwords.newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await api.put("/api/v1/change-password", {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
      });
      setMessage({ type: "success", text: response.data.message });
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update password",
      });
    } finally {
      setLoading(false);
    }
  };

  const fonts = [
    { id: "'Ubuntu Mono', monospace", name: "Ubuntu Mono" },
    { id: "'Fira Code', monospace", name: "Fira Code" },
    { id: "'Roboto Mono', monospace", name: "Roboto Mono" },
    { id: "'Source Code Pro', monospace", name: "Source Code Pro" },
    { id: "'JetBrains Mono', monospace", name: "JetBrains Mono" },
  ];

  const themes = [
    { id: "vs-dark", name: "VS Dark", color: "bg-[#1E1E1E]" },
    { id: "light", name: "Light", color: "bg-white" },
    { id: "hc-black", name: "High Contrast", color: "bg-black" },
    { id: "monokai", name: "Monokai", color: "bg-[#272822]" },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans py-12 px-4">
      <div className="w-full mx-auto px-2 lg:px-12">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-8 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group"
        >
          <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          Back to Dashboard
        </button>

        <div className="glass-card rounded-3xl border border-white/5 overflow-hidden flex flex-col md:flex-row h-[70vh] md:h-[600px]">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 bg-black/20 border-r border-white/5 p-6 flex flex-col gap-2">
            <h2 className="text-xl font-bold mb-6 px-2">Settings</h2>
            <button
              onClick={() => { setActiveTab("editor"); setMessage({type: "", text: ""}); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'editor' ? 'bg-brand-purple/10 text-brand-purple border border-brand-purple/20' : 'text-neutral-400 hover:bg-white/5'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
              Editor
            </button>
            <button
              onClick={() => { setActiveTab("appearance"); setMessage({type: "", text: ""}); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'appearance' ? 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20' : 'text-neutral-400 hover:bg-white/5'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
              Appearance
            </button>
            <button
              onClick={() => { setActiveTab("security"); setMessage({type: "", text: ""}); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'security' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'text-neutral-400 hover:bg-white/5'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Security
            </button>
            <button
              onClick={() => { setActiveTab("account"); setMessage({type: "", text: ""}); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'account' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-neutral-400 hover:bg-white/5'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              Account
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-8 md:p-12 bg-black/40 relative overflow-y-auto min-h-0 custom-scrollbar">
            {message.text && (
              <div className={`mb-8 p-4 rounded-xl text-sm font-medium animate-fade-in ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {message.text}
              </div>
            )}

            {(activeTab === "editor" || activeTab === "appearance") && (
              <form onSubmit={handleSubmit} className="h-full flex flex-col">
                {activeTab === "editor" && (
                  <div className="space-y-8 animate-fade-in">
                    <div>
                      <h3 className="text-lg font-bold mb-1">Editor Settings</h3>
                      <p className="text-neutral-500 text-sm">Customize your coding environment</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-neutral-300">Font Size (px)</label>
                        <input
                          type="number"
                          value={settings.fontSize}
                          onChange={(e) => handleChange("fontSize", parseInt(e.target.value))}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-purple transition-all"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-neutral-300">Font Family</label>
                        <select
                          value={settings.fontFamily}
                          onChange={(e) => handleChange("fontFamily", e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-purple transition-all appearance-none cursor-pointer"
                          style={{ fontFamily: settings.fontFamily }}
                        >
                          {fonts.map(f => (
                            <option key={f.id} value={f.id} style={{ fontFamily: f.id }}>{f.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-neutral-300">Tab Size</label>
                        <select
                          value={settings.tabSize}
                          onChange={(e) => handleChange("tabSize", parseInt(e.target.value))}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-purple transition-all appearance-none cursor-pointer"
                        >
                          <option value={2}>2 Spaces</option>
                          <option value={4}>4 Spaces</option>
                          <option value={8}>8 Spaces</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-6 pt-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div>
                          <p className="text-sm font-bold">Line Numbers</p>
                          <p className="text-xs text-neutral-500">Show line numbers in the editor</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleChange("lineNumbers", !settings.lineNumbers)}
                          className={`w-12 h-6 rounded-full transition-all relative ${settings.lineNumbers ? 'bg-brand-purple' : 'bg-neutral-800'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.lineNumbers ? 'left-7' : 'left-1'}`}></div>
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div>
                          <p className="text-sm font-bold">Auto Save</p>
                          <p className="text-xs text-neutral-500">Automatically save changes while typing</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleChange("autoSave", !settings.autoSave)}
                          className={`w-12 h-6 rounded-full transition-all relative ${settings.autoSave ? 'bg-brand-cyan' : 'bg-neutral-800'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.autoSave ? 'left-7' : 'left-1'}`}></div>
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div>
                          <p className="text-sm font-bold">Multi-Tab Editor</p>
                          <p className="text-xs text-neutral-500">Enable multiple files to be open simultaneously</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleChange("multiTabs", !settings.multiTabs)}
                          className={`w-12 h-6 rounded-full transition-all relative ${settings.multiTabs ? 'bg-brand-purple' : 'bg-neutral-800'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.multiTabs ? 'left-7' : 'left-1'}`}></div>
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div>
                          <p className="text-sm font-bold">Mouse Wheel Zoom</p>
                          <p className="text-xs text-neutral-500">Zoom in/out using Ctrl + Mouse Wheel</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleChange("mouseWheelZoom", !settings.mouseWheelZoom)}
                          className={`w-12 h-6 rounded-full transition-all relative ${settings.mouseWheelZoom ? 'bg-brand-cyan' : 'bg-neutral-800'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.mouseWheelZoom ? 'left-7' : 'left-1'}`}></div>
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div>
                          <p className="text-sm font-bold">Sticky Scroll</p>
                          <p className="text-xs text-neutral-500">Keep scope headers pinned at the top</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleChange("stickyScroll", !settings.stickyScroll)}
                          className={`w-12 h-6 rounded-full transition-all relative ${settings.stickyScroll ? 'bg-brand-purple' : 'bg-neutral-800'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.stickyScroll ? 'left-7' : 'left-1'}`}></div>
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div>
                          <p className="text-sm font-bold">Editor Minimap</p>
                          <p className="text-xs text-neutral-500">Show a thumbnail overview of the file</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleChange("minimap", !settings.minimap)}
                          className={`w-12 h-6 rounded-full transition-all relative ${settings.minimap ? 'bg-brand-cyan' : 'bg-neutral-800'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.minimap ? 'left-7' : 'left-1'}`}></div>
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div>
                          <p className="text-sm font-bold">Bracket Colorization</p>
                          <p className="text-xs text-neutral-500">Color-code matching bracket pairs</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleChange("bracketColorization", !settings.bracketColorization)}
                          className={`w-12 h-6 rounded-full transition-all relative ${settings.bracketColorization ? 'bg-brand-purple' : 'bg-neutral-800'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.bracketColorization ? 'left-7' : 'left-1'}`}></div>
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div>
                          <p className="text-sm font-bold">Render Whitespace</p>
                          <p className="text-xs text-neutral-500">Show visual indicators for spaces/tabs</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleChange("renderWhitespace", !settings.renderWhitespace)}
                          className={`w-12 h-6 rounded-full transition-all relative ${settings.renderWhitespace ? 'bg-brand-cyan' : 'bg-neutral-800'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.renderWhitespace ? 'left-7' : 'left-1'}`}></div>
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div>
                          <p className="text-sm font-bold">Format on Save</p>
                          <p className="text-xs text-neutral-500">Automatically format code when saving</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleChange("formatOnSave", !settings.formatOnSave)}
                          className={`w-12 h-6 rounded-full transition-all relative ${settings.formatOnSave ? 'bg-brand-purple' : 'bg-neutral-800'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.formatOnSave ? 'left-7' : 'left-1'}`}></div>
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div>
                          <p className="text-sm font-bold">Format Before Run</p>
                          <p className="text-xs text-neutral-500">Automatically format code before running</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleChange("formatBeforeRun", !settings.formatBeforeRun)}
                          className={`w-12 h-6 rounded-full transition-all relative ${settings.formatBeforeRun ? 'bg-brand-cyan' : 'bg-neutral-800'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.formatBeforeRun ? 'left-7' : 'left-1'}`}></div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "appearance" && (
                  <div className="space-y-8 animate-fade-in">
                    <div>
                      <h3 className="text-lg font-bold mb-1">Editor Theme</h3>
                      <p className="text-neutral-500 text-sm">Choose the look of your code</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {themes.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => handleChange("theme", t.id)}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${settings.theme === t.id ? 'border-brand-purple bg-brand-purple/5' : 'border-white/5 hover:border-white/10'}`}
                        >
                           <div className={`w-full h-24 rounded-lg mb-3 ${t.color} border border-white/10 flex flex-col p-2 gap-1`}>
                              <div className="w-1/2 h-1.5 bg-neutral-500/20 rounded"></div>
                              <div className="w-3/4 h-1.5 bg-neutral-500/20 rounded"></div>
                              <div className="w-1/3 h-1.5 bg-neutral-500/20 rounded"></div>
                           </div>
                           <p className={`text-sm font-bold text-center ${settings.theme === t.id ? 'text-white' : 'text-neutral-400'}`}>{t.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-10 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary px-8 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    )}
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {activeTab === "security" && (
              <form onSubmit={handlePasswordSubmit} className="h-full flex flex-col animate-fade-in">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold mb-1">Security</h3>
                    <p className="text-neutral-500 text-sm">Update your password to keep your account secure</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-neutral-300">Current Password</label>
                      <input
                        type="password"
                        name="oldPassword"
                        value={passwords.oldPassword}
                        onChange={handlePasswordChange}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-all"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-neutral-300">New Password</label>
                        <input
                          type="password"
                          name="newPassword"
                          value={passwords.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-all"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-neutral-300">Confirm New Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={passwords.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-all"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-10 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    )}
                    Update Password
                  </button>
                </div>
              </form>
            )}

            {activeTab === "account" && (
              <div className="space-y-8 animate-fade-in">
                 <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                    <h4 className="text-red-400 font-bold mb-2">Danger Zone</h4>
                    <p className="text-neutral-400 text-sm mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                    <div className="flex items-center gap-4">
                      <button 
                        type="button" 
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${showDeleteConfirm ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-red-500 hover:bg-red-600'}`}
                      >
                        {deleteLoading ? 'Deleting...' : showDeleteConfirm ? 'Click to Confirm Deletion' : 'Delete Account'}
                      </button>
                      {showDeleteConfirm && (
                        <button 
                          type="button" 
                          onClick={() => setShowDeleteConfirm(false)}
                          className="text-neutral-500 hover:text-white text-sm font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
