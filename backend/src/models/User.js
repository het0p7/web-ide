import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: {
      type: "String",
      required: true,
    },
    email: {
      type: "String",
      required: true,
      unique: true,
    },
    password: {
      type: "String",
      required: true,
    },
    role: {
      type: "String",
      default: "user",
    },
    avatar: {
      type: "String",
      default: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
    },
    bio: {
      type: "String",
      default: "",
    },
    socialLinks: {
      github: { type: "String", default: "" },
      linkedin: { type: "String", default: "" },
      twitter: { type: "String", default: "" },
    },
    settings: {
      theme: { type: "String", default: "vs-dark" },
      fontSize: { type: Number, default: 14 },
      fontFamily: { type: String, default: "'Ubuntu Mono', monospace" },
      tabSize: { type: Number, default: 2 },
      lineNumbers: { type: Boolean, default: true },
      autoSave: { type: Boolean, default: true },
      multiTabs: { type: Boolean, default: false },
      mouseWheelZoom: { type: Boolean, default: false },
      stickyScroll: { type: Boolean, default: true },
      minimap: { type: Boolean, default: false },
      bracketColorization: { type: Boolean, default: true },
      renderWhitespace: { type: Boolean, default: false },
      formatOnSave: { type: Boolean, default: false },
      formatBeforeRun: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", schema);
