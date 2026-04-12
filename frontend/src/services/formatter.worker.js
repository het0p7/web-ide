import * as prettier from "prettier/standalone";
import * as babel from "prettier/plugins/babel";
import * as estree from "prettier/plugins/estree";
import * as html from "prettier/plugins/html";
import * as postcss from "prettier/plugins/postcss";

let javaPlugin = null;

self.onmessage = async (e) => {
  const { code, filePath, id } = e.data;
  
  if (!code) {
    self.postMessage({ id, formatted: code });
    return;
  }

  const ext = filePath.split(".").pop().toLowerCase();
  
  let parser = "";
  let plugins = [babel, estree, html, postcss];

  switch (ext) {
    case "js":
    case "jsx":
      parser = "babel";
      break;
    case "ts":
    case "tsx":
      parser = "babel-ts";
      break;
    case "html":
      parser = "html";
      break;
    case "css":
    case "scss":
    case "less":
      parser = "css";
      break;
    case "json":
      parser = "json";
      break;
    case "java":
        if (!javaPlugin) {
            // In worker with Vite, we use dynamic import
            javaPlugin = (await import("prettier-plugin-java")).default;
        }
        parser = "java";
        plugins.push(javaPlugin);
        break;
    default:
      self.postMessage({ id, formatted: code });
      return;
  }

  try {
    const formatted = await prettier.format(code, {
      parser,
      plugins,
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: false,
    });
    self.postMessage({ id, formatted });
  } catch (error) {
    console.error("Worker Formatting error:", error);
    self.postMessage({ id, error: error.message, formatted: code });
  }
};
