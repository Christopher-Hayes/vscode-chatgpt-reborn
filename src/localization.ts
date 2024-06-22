import path from 'path-browserify';
import * as vscode from 'vscode';
import { readFileIfExists } from "./helpers";
const fs = vscode.workspace.fs;

export async function loadTranslations(extensionPath: string): Promise<Record<string, string>> {
  // Load default package.nls.json file
  const defaultTranslationsPath = path.join(extensionPath, 'package.nls.json');
  const defaultTranslations = JSON.parse(await readFileIfExists(defaultTranslationsPath) ?? '');

  // Detect the current locale
  const locale = vscode.env.language;

  // Load the locale-specific translations file if it exists
  const localeTranslationsPath = path.join(extensionPath, '', `package.nls.${locale}.json`);
  let localeTranslations = {};

  try {
    localeTranslations = JSON.parse(await readFileIfExists(localeTranslationsPath) ?? '');
  } catch (err: any) {
    console.error(`[Reborn AI] Locale translations not found: ${err.message}`);
  }

  // Merge default translations with locale-specific translations
  const combinedTranslations = { ...defaultTranslations, ...localeTranslations };

  // Iterate through the keys and for each period in the key, create a nested object and move the value to the leaf
  for (const key of Object.keys(combinedTranslations)) {
    const value = combinedTranslations[key];
    const parts = key.split('.');
    let current = combinedTranslations;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];

      if (!current[part]) {
        current[part] = {};
      }

      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
    delete combinedTranslations[key];
  }

  return combinedTranslations;
}