import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    language: {
      type: String,
      required: true,
    },

    entryFile: {
      type: String,
      default: null,
    },

    input: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed", "cancelled"],
      default: "pending",
      index: true,
    },

    output: {
      type: String,
      default: "",
    },

    error: {
      type: String,
      default: null,
    },

    executionTime: {
      type: Number,
      default: 0,
    },

    exitCode: {
      type: Number,
      default: null,
    },

    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true },
);

export const Job = mongoose.model("Job", jobSchema);
