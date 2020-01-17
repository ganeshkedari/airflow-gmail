"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const python_indent_parser_1 = require("python-indent-parser");
function newlineAndIndent(textEditor, edit, args) {
    // Get rid of any user selected text, since a selection is
    // always deleted whenever ENTER is pressed.
    // This should always happen first
    if (!textEditor.selection.isEmpty) {
        edit.delete(textEditor.selection);
        // Make sure we get rid of the selection range.
        textEditor.selection = new vscode.Selection(textEditor.selection.start, textEditor.selection.start);
    }
    const position = textEditor.selection.active;
    const tabSize = textEditor.options.tabSize;
    const insertionPoint = new vscode.Position(position.line, position.character);
    const currentLine = textEditor.document.lineAt(position).text;
    let snippetCursor = '$0';
    if (vscode.workspace.getConfiguration('pythonIndent').useTabOnHangingIndent) {
        snippetCursor = '$1';
    }
    let hanging = python_indent_parser_1.Hanging.None;
    let toInsert = '\n';
    try {
        if (textEditor.document.languageId === 'python') {
            const lines = textEditor.document.getText(new vscode.Range(0, 0, position.line, position.character)).split("\n");
            let { nextIndentationLevel: indent } = python_indent_parser_1.indentationInfo(lines, tabSize);
            const spacesToRemove = currentLineDedentation(lines, tabSize);
            if (spacesToRemove > 0) {
                edit.delete(new vscode.Range(position.line, 0, position.line, spacesToRemove));
                indent = Math.max(indent - spacesToRemove, 0);
            }
            hanging = python_indent_parser_1.shouldHang(currentLine, position.character);
            if (hanging === python_indent_parser_1.Hanging.Partial) {
                toInsert = '\n' + ' '.repeat(python_indent_parser_1.indentationLevel(currentLine) + tabSize);
            }
            else {
                toInsert = '\n' + ' '.repeat(Math.max(indent, 0));
            }
            if (extendCommentToNextLine(currentLine, position.character)) {
                toInsert = toInsert + '# ';
            }
        }
    }
    finally {
        // we never ever want to crash here, fallback on just inserting newline
        if (hanging === python_indent_parser_1.Hanging.Full) {
            // Hanging indents end up with the cursor in a bad place if we
            // just use the edit.insert() function, snippets behave better.
            // The VSCode snippet logic already does some indentation handling,
            // so don't use the toInsert, just ' ' * tabSize.
            // That behavior is not documented.
            textEditor.insertSnippet(new vscode.SnippetString('\n' + ' '.repeat(tabSize) + snippetCursor + '\n'));
        }
        else {
            edit.insert(insertionPoint, toInsert);
        }
        textEditor.revealRange(new vscode.Range(position, new vscode.Position(position.line + 2, 0)));
    }
}
exports.newlineAndIndent = newlineAndIndent;
// Current line is a comment line, and we should make the next one commented too.
function extendCommentToNextLine(line, pos) {
    if (line.trim().startsWith('#') && line.slice(pos).trim().length && line.slice(0, pos).trim().length) {
        return true;
    }
    return false;
}
exports.extendCommentToNextLine = extendCommentToNextLine;
// Returns the number of spaces that should be removed from the current line
function currentLineDedentation(lines, tabSize) {
    const dedentKeywords = { elif: ["if"], else: ["if", "try", "for", "while"], except: ["try"], finally: ["try"] };
    // Reverse to help searching
    lines = lines.reverse();
    const line = lines[0];
    const trimmed = line.trim();
    if (trimmed.endsWith(":")) {
        for (const keyword of Object.keys(dedentKeywords).filter((key) => trimmed.startsWith(key))) {
            for (const matchedLine of lines.slice(1).filter((l) => l.trim().endsWith(":"))) {
                const matchedLineTrimmed = matchedLine.trim();
                if (dedentKeywords[keyword].some((matcher) => matchedLineTrimmed.startsWith(matcher))) {
                    const currentIndent = python_indent_parser_1.indentationLevel(line);
                    const matchedIndent = python_indent_parser_1.indentationLevel(matchedLine);
                    return Math.max(0, Math.min(tabSize, currentIndent, currentIndent - matchedIndent));
                }
            }
        }
    }
    return 0;
}
exports.currentLineDedentation = currentLineDedentation;
//# sourceMappingURL=indent.js.map