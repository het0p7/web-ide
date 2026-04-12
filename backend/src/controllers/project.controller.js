import { Project } from "../models/Project.js";
import { filesystemService } from "../services/filesystem.service.js";
import { executionService } from "../services/execution.service.js";
import { templateService } from "../services/template.service.js";
import { sessionService } from "../services/session.service.js";
import mongoose from "mongoose";

const checkOwnership = (project, userId) => {
  if (project.owner.toString() !== userId.toString()) {
    const error = new Error("Not authorized to access this project");
    error.status = 403;
    throw error;
  }
};

/**
 * =========================================
 * Stateless Execution
 * =========================================
 */
export const executeProjectStateless = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    checkOwnership(project, req.user._id);

    if (!project.entryPoint) {
      return res.status(400).json({
        success: false,
        error: "Project entry point not set",
      });
    }

    const result = await executionService.executeStateless({
      userId: project.owner.toString(),
      projectId: project._id.toString(),
      language: project.language,
      entryPoint: project.entryPoint,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================
 * Create Project (Realistic Templates)
 * =========================================
 */
export const createProject = async (req, res, next) => {
  try {
    const { name, description, language } = req.body;

    if (!name || !language) {
      return res.status(400).json({
        success: false,
        error: "Project name and language are required",
      });
    }

    // 1️⃣ Create Mongo project
    const project = await Project.create({
      owner: req.user._id,
      name,
      description: description || "",
      language,
    });

    try {
      // 2️⃣ Create filesystem root
      await filesystemService.ensureProjectRoot(
        project.owner.toString(),
        project._id.toString(),
      );

      // 3️⃣ Create realistic language template
      const entryPoint = await templateService.createTemplate({
        userId: project.owner.toString(),
        projectId: project._id.toString(),
        projectName: project.name,
        language: project.language,
      });

      // 4️⃣ Save entry point
      project.entryPoint = entryPoint;
      await project.save();
    } catch (fsError) {
      // Rollback Mongo if filesystem fails
      await Project.findByIdAndDelete(project._id);
      throw fsError;
    }

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================
 * Get Project Tree
 * =========================================
 */
export const getProjectTree = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    checkOwnership(project, req.user._id);

    const tree = await filesystemService.listTree(
      project.owner.toString(),
      project._id.toString(),
    );

    res.json({
      success: true,
      tree,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================
 * File Operations
 * =========================================
 */
export const getFileContent = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { path: filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: "File path is required",
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    checkOwnership(project, req.user._id);

    const content = await filesystemService.readFile({
      userId: project.owner.toString(),
      projectId: project._id.toString(),
      filePath,
    });

    res.json({
      success: true,
      content,
    });
  } catch (error) {
    next(error);
  }
};

export const createFile = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { path: filePath, content = "" } = req.body;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: "File path is required",
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    checkOwnership(project, req.user._id);

    await filesystemService.createFile({
      userId: project.owner.toString(),
      projectId: project._id.toString(),
      filePath,
      content,
    });

    res.status(201).json({
      success: true,
      message: "File created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const createFolder = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { path: folderPath } = req.body;

    if (!folderPath) {
      return res.status(400).json({
        success: false,
        error: "Folder path is required",
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    checkOwnership(project, req.user._id);

    await filesystemService.createFolder({
      userId: project.owner.toString(),
      projectId: project._id.toString(),
      folderPath,
    });

    res.status(201).json({
      success: true,
      message: "Folder created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateFileContent = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { path: filePath, content } = req.body;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: "File path is required",
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    checkOwnership(project, req.user._id);

    await filesystemService.updateFile({
      userId: project.owner.toString(),
      projectId: project._id.toString(),
      filePath,
      content,
    });

    // Touch the project to update updatedAt
    project.updatedAt = new Date();
    await project.save();

    res.json({
      success: true,
      message: "File updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deletePath = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { path: targetPath } = req.body;

    if (!targetPath) {
      return res.status(400).json({
        success: false,
        error: "Path is required",
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    checkOwnership(project, req.user._id);

    try {
      await filesystemService.deleteFile({
        userId: project.owner.toString(),
        projectId: project._id.toString(),
        filePath: targetPath,
      });
    } catch {
      await filesystemService.deleteFolder({
        userId: project.owner.toString(),
        projectId: project._id.toString(),
        folderPath: targetPath,
      });
    }

    res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const renamePath = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { oldPath, newPath } = req.body;

    if (!oldPath || !newPath) {
      return res.status(400).json({
        success: false,
        error: "Old path and new path are required",
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    checkOwnership(project, req.user._id);

    await filesystemService.renamePath({
      userId: project.owner.toString(),
      projectId: project._id.toString(),
      oldPath,
      newPath,
    });

    res.json({
      success: true,
      message: "Renamed successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const movePath = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { oldPath, newPath } = req.body;

    if (!oldPath || !newPath) {
      return res.status(400).json({
        success: false,
        error: "Old path and new path are required",
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    checkOwnership(project, req.user._id);

    await filesystemService.renamePath({
      userId: project.owner.toString(),
      projectId: project._id.toString(),
      oldPath,
      newPath,
    });

    res.json({
      success: true,
      message: "Moved successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================
 * Get All Projects
 * =========================================
 */
export const getAllProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ owner: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      projects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================
 * Get Single Project
 * =========================================
 */
export const getProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            error: "Not authorized to access this project",
        });
    }

    res.json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================
 * Delete Project
 * =========================================
 */
export const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    checkOwnership(project, req.user._id);

    // Immediately teardown any active Docker containers/sessions
    try {
        await sessionService.stopSession(project.owner.toString(), project._id.toString());
    } catch (sessionError) {
        console.error("Error destroying session container:", sessionError);
    }

    // Delete project directory via filesystem service
    try {
      await filesystemService.deleteProjectRoot(
        project.owner.toString(),
        projectId
      );
    } catch (fsError) {
      console.error("Error deleting project files:", fsError);
      // Continue with DB deletion even if filesystem fails
    }

    // Delete from database
    await Project.findByIdAndDelete(projectId);

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================
 * Toggle Star Project
 * =========================================
 */
export const toggleStarProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    checkOwnership(project, req.user._id);

    project.isStarred = !project.isStarred;
    await project.save();

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================
 * Trash Project (Soft Delete)
 * =========================================
 */
export const trashProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    checkOwnership(project, req.user._id);

    project.isTrashed = true;
    await project.save();

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================
 * Restore Project
 * =========================================
 */
export const restoreProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    checkOwnership(project, req.user._id);

    project.isTrashed = false;
    await project.save();

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

