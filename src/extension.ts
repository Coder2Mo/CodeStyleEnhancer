import * as vscode from 'vscode';
import { activate as autoCloseBracketsActivate, deactivate as autoCloseBracketsDeactivate } from '../src/autoCloseBrackets';

export function activate(context: vscode.ExtensionContext) {
    autoCloseBracketsActivate(context);
  }
  
  export function deactivate() {
    autoCloseBracketsDeactivate();
  }