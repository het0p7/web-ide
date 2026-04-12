import path from "path";
import { filesystemService } from "./filesystem.service.js";

class TemplateService {
  async createTemplate({ userId, projectId, projectName, language }) {
    switch (language) {
      case "javascript":
        return this.createJavaScriptTemplate({
          userId,
          projectId,
          projectName,
        });

      case "python":
        return this.createPythonTemplate({ userId, projectId });

      case "c":
        return this.createCTemplate({ userId, projectId });

      case "cpp":
        return this.createCppTemplate({ userId, projectId });

      case "java":
        return this.createJavaTemplate({ userId, projectId });

      default:
        throw new Error("Unsupported language for template");
    }
  }

  // =============================
  // JavaScript Template
  // =============================
  async createJavaScriptTemplate({ userId, projectId, projectName }) {
    await filesystemService.createFolder({
      userId,
      projectId,
      folderPath: "src",
    });

    await filesystemService.createFile({
      userId,
      projectId,
      filePath: "src/app.js",
      content: `console.log("Hello, World!");\n`,
    });

    await filesystemService.createFile({
      userId,
      projectId,
      filePath: "package.json",
      content: JSON.stringify(
        {
          name: projectName.toLowerCase().replace(/\s+/g, "-"),
          version: "1.0.0",
          main: "src/app.js",
          scripts: {
            start: "node src/app.js",
          },
        },
        null,
        2,
      ),
    });

    await filesystemService.createFile({
      userId,
      projectId,
      filePath: "README.md",
      content: `# ${projectName}\n\nJavaScript Project\n`,
    });

    return "src/app.js";
  }

  // =============================
  // Python Template
  // =============================
  async createPythonTemplate({ userId, projectId }) {
    await filesystemService.createFile({
      userId,
      projectId,
      filePath: "main.py",
      content: `print("Hello, World!")\n`,
    });

    return "main.py";
  }

  // =============================
  // C Template
  // =============================
  async createCTemplate({ userId, projectId }) {
    await filesystemService.createFile({
      userId,
      projectId,
      filePath: "main.c",
      content: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
`,
    });

    return "main.c";
  }

  // =============================
  // C++ Template
  // =============================
  async createCppTemplate({ userId, projectId }) {
    await filesystemService.createFile({
      userId,
      projectId,
      filePath: "main.cpp",
      content: `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
`,
    });

    return "main.cpp";
  }

  // =============================
  // Java Template
  // =============================
  async createJavaTemplate({ userId, projectId }) {
    await filesystemService.createFile({
      userId,
      projectId,
      filePath: "Main.java",
      content: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
    });

    return "Main.java";
  }
}

export const templateService = new TemplateService();
export default templateService;
