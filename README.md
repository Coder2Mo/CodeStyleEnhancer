# CodeStyleEnhancer

<div align="center">
    <img width="100%" alt="CodeStyleEnhancer" src="https://github.com/Coder2Mo/CodeStyleEnhancer/blob/main/images/icon.png">
</div>

This Extension serves as the implementation of a Visual Studio Code extension that provides enhanced auto-closing bracket functionality.
The main purpose of the extension is to automatically insert closing brackets, such as parentheses, square brackets, and curly braces, as well as various types of quotes and code blocks in specific scenarios.
The extension also offers features like matching bracket highlighting, auto-closing inside comments, and configurable behaviors for different languages.</p><p>
Here's what the code does:</p><ol><li><p><strong>Auto-Closing Brackets and Quotes:</strong> The extension automatically inserts closing brackets when an opening bracket is typed.
It also handles auto-closing quotes like double quotes, single quotes, and backticks.</p></li><li><p>
<strong>Matching Bracket Highlighting:</strong> The extension highlights the matching opening bracket when the cursor is near a closing bracket.</p></li><li><p><strong>Auto-Closing Inside Comments:</strong> The extension optionally closes brackets and quotes inside comments, depending on user configuration.</p></li><li><p><strong>Auto-Closing in Markdown Code Blocks:</strong> The extension can automatically insert closing markers for code blocks in Markdown files.</p></li><li><p><strong>Customizable Auto-Close Rules:</strong> You can define auto-close behavior based on language rules. For example, you can configure whether a closing bracket is placed on the same line or a new line after an opening bracket.</p></li><li><p>
<strong>Custom Triggers:</strong> You can define custom triggers that, when typed, insert specific code snippets.</p></li>
<li><p><strong>Linting Integration:</strong> The extension integrates with linting tools (configurable through the <code>lintingTool</code> setting) and can process linting results. However, the specific linting functionality (e.g., handling linting results) appears to be a work in progress and may need further development to integrate seamlessly.</p></li><li>
  <p><strong>Bracket Pair Decoration:</strong> The extension provides bracket pair decoration to visually highlight matched opening and closing brackets.</p></li>
  <li><p><strong><code>braceWrap</code> Command:</strong> You can use the <code>braceWrap</code> command to wrap selected code with curly braces.</p></li>
  <li><p><strong><code>goToMatchingBracket</code> Command:</strong> The extension provides the <code>goToMatchingBracket</code> command to navigate between matching opening and closing brackets.</p></li>
  <li><p><strong>Formatting Provider:</strong> The extension registers a document formatting provider for TypeScript files.</p></li></ol>
