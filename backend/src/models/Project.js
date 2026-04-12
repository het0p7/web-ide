import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
    },

    language: {
      type: String,
      enum: ["javascript", "python", "java", "cpp", "c"],
      required: true,
    },

    entryPoint: {
      type: String, // relative path inside project folder
      default: null,
    },

    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },

    isStarred: {
      type: Boolean,
      default: false,
    },

    isTrashed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

projectSchema.index({ owner: 1, createdAt: -1 });

export const Project = mongoose.model("Project", projectSchema);
