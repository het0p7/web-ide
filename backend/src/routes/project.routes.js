import express from "express";
import {
  createProject,
  getProjectTree,
  getFileContent,
  createFile,
  createFolder,
  updateFileContent,
  deletePath,
  renamePath,
  movePath,
  getAllProjects,
  getProject,
  deleteProject,
  toggleStarProject,
  trashProject,
  restoreProject,
  executeProjectStateless,
} from "../controllers/project.controller.js";
import { isAuth } from "../middleware/isAuth.js";
import { rateLimit } from "../middleware/rateLimiter.js";

const execLimiter = rateLimit({ windowMs: 60000, max: 10, message: "Execution limit reached. Please wait." });
const sessionLimiter = rateLimit({ windowMs: 60000, max: 5, message: "Session creation limit reached. Please wait." });
import { sessionService } from "../services/session.service.js";
import { Project } from "../models/Project.js";

const router = express.Router();

// List all projects
router.get("/", isAuth, getAllProjects);

// Create project
router.post("/", isAuth, createProject);

// Get single project
router.get("/:projectId", isAuth, getProject);

// Delete project (permanent)
router.delete("/:projectId", isAuth, deleteProject);

// Toggle star project
router.patch("/:projectId/star", isAuth, toggleStarProject);

// Soft delete project
router.patch("/:projectId/trash", isAuth, trashProject);

// Restore project
router.patch("/:projectId/restore", isAuth, restoreProject);

// Project file tree
router.get("/:projectId/tree", isAuth, getProjectTree);

// Get file content
router.get("/:projectId/file", isAuth, getFileContent);

router.post("/:projectId/file", isAuth, createFile);
router.post("/:projectId/folder", isAuth, createFolder);

router.put("/:projectId/file", isAuth, updateFileContent);
router.put("/:projectId/rename", isAuth, renamePath);
router.put("/:projectId/move", isAuth, movePath);

router.delete("/:projectId/path", isAuth, deletePath);

// Execute project (stateless)
router.post("/:projectId/execute", isAuth, execLimiter, executeProjectStateless);

router.post("/:projectId/session/start", isAuth, sessionLimiter, async (req, res) => {
  try {
    console.log("Session start for project:", req.params.projectId);
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      console.log("Project not found");
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    console.log("Creating session for user:", project.owner.toString());
    const session = await sessionService.createSession({
      userId: project.owner.toString(),
      projectId: project._id.toString(),
      language: project.language,
    });

    console.log("Session created:", session);
    res.json(session);
  } catch (error) {
    console.error("Error in session start:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/:projectId/session/stop", isAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    await sessionService.stopSession(
      project.owner.toString(),
      project._id.toString(),
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error stopping session:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
