import { CompletionItem, CompletionItemKind, InsertTextFormat, Position } from 'vscode-languageserver-types'
import { SnippetParser } from '../snippets/parser'
import { CompleteOption } from '../types'
import { byteSlice, characterIndex } from './string'
const logger = require('./logger')('util-complete')

export function getPosition(opt: CompleteOption): Position {
  let { line, linenr, colnr } = opt
  let part = byteSlice(line, 0, colnr - 1)
  return {
    line: linenr - 1,
    character: part.length
  }
}

export function getWord(item: CompletionItem, opt: CompleteOption, invalidInsertCharacters: string[]): string {
  // tslint:disable-next-line: deprecation
  let { label, insertTextFormat, insertText, textEdit } = item
  let word: string
  let newText: string
  if (textEdit) {
    let { range } = textEdit
    newText = textEdit.newText
    if (range && range.start.line == range.end.line) {
      let { line, col, colnr } = opt
      let character = characterIndex(line, col)
      if (range.start.character > character) {
        let before = line.slice(character - range.start.character)
        newText = before + newText
      } else {
        let start = line.slice(range.start.character, character)
        if (start.length && newText.startsWith(start)) {
          newText = newText.slice(start.length)
        }
      }
      character = characterIndex(line, colnr - 1)
      if (range.end.character > character) {
        let end = line.slice(character, range.end.character)
        if (newText.endsWith(end)) {
          newText = newText.slice(0, - end.length)
        }
      }
    }
  } else {
    newText = insertText
  }
  if (insertTextFormat == InsertTextFormat.Snippet) {
    if (newText) {
      let parser = new SnippetParser()
      let snippet = parser.text(newText.trim())
      word = snippet ? getValidWord(snippet, invalidInsertCharacters) : label
    } else {
      word = label
    }
  } else {
    word = getValidWord(newText, invalidInsertCharacters) || label
  }
  return word
}

export function getDocumentation(item: CompletionItem): string {
  let { documentation } = item
  if (!documentation) return ''
  if (typeof documentation === 'string') return documentation
  return documentation.value
}

export function completionKindString(kind: CompletionItemKind): string {
  switch (kind) {
    case CompletionItemKind.Text:
      return 'v'
    case CompletionItemKind.Method:
      return 'f'
    case CompletionItemKind.Function:
      return 'f'
    case CompletionItemKind.Constructor:
      return 'f'
    case CompletionItemKind.Field:
      return 'm'
    case CompletionItemKind.Variable:
      return 'v'
    case CompletionItemKind.Class:
      return 'C'
    case CompletionItemKind.Interface:
      return 'I'
    case CompletionItemKind.Module:
      return 'M'
    case CompletionItemKind.Property:
      return 'm'
    case CompletionItemKind.Unit:
      return 'U'
    case CompletionItemKind.Value:
      return 'v'
    case CompletionItemKind.Enum:
      return 'E'
    case CompletionItemKind.Keyword:
      return 'k'
    case CompletionItemKind.Snippet:
      return 'S'
    case CompletionItemKind.Color:
      return 'v'
    case CompletionItemKind.File:
      return 'F'
    case CompletionItemKind.Reference:
      return 'r'
    case CompletionItemKind.Folder:
      return 'F'
    case CompletionItemKind.EnumMember:
      return 'm'
    case CompletionItemKind.Constant:
      return 'v'
    case CompletionItemKind.Struct:
      return 'S'
    case CompletionItemKind.Event:
      return 'E'
    case CompletionItemKind.Operator:
      return 'O'
    case CompletionItemKind.TypeParameter:
      return 'T'
    default:
      return ''
  }
}

export function getSnippetDocumentation(languageId: string, body: string): string {
  languageId = languageId.replace(/react$/, '')
  let str = body.replace(/\$\d+/g, '').replace(/\$\{\d+(?::([^{]+))?\}/, '$1')
  str = '``` ' + languageId + '\n' + str + '\n' + '```'
  return str
}

export function getValidWord(text: string, invalidChars: string[]): string {
  if (!text) return ''
  for (let i = 0; i < text.length; i++) {
    let c = text[i]
    if (invalidChars.indexOf(c) !== -1 || c == '\r' || c == '\n') {
      return text.slice(0, i)
    }
  }
  return text
}
