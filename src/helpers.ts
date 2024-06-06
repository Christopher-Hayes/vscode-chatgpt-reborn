import fs from "fs";
import upath from 'upath';
import * as vscode from 'vscode';
import { Model } from "./renderer/types";

export function readDirRecursively(dir: string, maxDepth: number, currentDepth: number = 0): string[] {
  if (currentDepth > maxDepth) {
    return [];
  }

  const items: string[] = [];
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    const entryPath = upath.join(dir, entry);
    const entryStat = fs.statSync(entryPath);

    if (entryStat.isDirectory()) {
      items.push(entryPath, ...readDirRecursively(entryPath, maxDepth, currentDepth + 1));
    } else {
      items.push(entryPath);
    }
  }

  return items;
}

// Get the list of items in the current project directory
export function listItems(currentProjectDir: string): string[] {
  // Ignore .gitignore and .git entries
  const gitignorePath = upath.join(currentProjectDir, '.gitignore');
  let gitignoreContents = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf-8') : '';
  // Also ignore .git
  gitignoreContents += '\n.git';
  const gitignoreEntries = gitignoreContents.split('\n').map(line => line.trim()).filter(line => line.length > 0).filter(line => !line.startsWith('#'));

  // Read up to 50 items and up to 3 levels deep of the current project directory
  const items = readDirRecursively(currentProjectDir, 2); // "2" for up to 3 levels (0, 1, 2)
  const filteredItems = items
    .filter(item => !gitignoreEntries.some(gitignoreEntry => item.includes(gitignoreEntry)))
    .slice(0, 50);

  return filteredItems;
}

const deprecatedModelMap = new Map<string, Model>([
  // Legacy - gpt-4-turbo is no longer in preview, use the latest model alias
  ['gpt-4-1106-preview', Model.gpt_4_turbo],
  // Legacy - All gpt-3.5-turbo models are now 16k
  ['gpt-3.5-turbo-16k', Model.gpt_35_turbo],
  // With gpt-4o and gpt-4-turbo, this model is of limited use
  ['gpt-4-32k', Model.gpt_4],
]);

function getUpdatedModel(model: string): string {
  // Replace deprecated model with the newer equivalent
  return deprecatedModelMap.get(model) || model;
}

export function getSelectedModel(): string {
  // Fetch the current model and update if it's deprecated
  const currentModel = vscode.workspace.getConfiguration("chatgpt").get("gpt3.model", 'gpt-4-turbo');
  const updatedModel = getUpdatedModel(currentModel);

  if (currentModel !== updatedModel) {
    vscode.workspace.getConfiguration("chatgpt").update("gpt3.model", updatedModel, vscode.ConfigurationTarget.Global);
    console.debug(`Updated deprecated model "${currentModel}" to "${updatedModel}".`);
  }

  return updatedModel;
}

export async function updateSelectedModel(newModel: string): Promise<string> {
  // Check and update the model if it's deprecated
  const updatedModel = getUpdatedModel(newModel);

  await vscode.workspace.getConfiguration("chatgpt").update("gpt3.model", updatedModel, vscode.ConfigurationTarget.Global);

  if (newModel !== updatedModel) {
    console.debug(`Updated deprecated model "${newModel}" to "${updatedModel}".`);
  }

  return updatedModel;
}