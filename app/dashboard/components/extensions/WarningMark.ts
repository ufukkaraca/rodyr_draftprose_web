import { Mark, mergeAttributes } from '@tiptap/core';

export interface WarningMarkOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    warningMark: {
      setWarningMark: (attributes?: { message: string; severity: 'warning' | 'error' }) => ReturnType;
      unsetWarningMark: () => ReturnType;
    }
  }
}

export const WarningMark = Mark.create<WarningMarkOptions>({
  name: 'warningMark',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'proactive-warning',
      },
    }
  },

  addAttributes() {
    return {
      message: {
        default: null,
        parseHTML: element => element.getAttribute('title'),
        renderHTML: attributes => {
          if (!attributes.message) {
            return {}
          }
          return {
            title: attributes.message,
          }
        },
      },
      severity: {
        default: 'warning',
        parseHTML: element => element.getAttribute('data-severity'),
        renderHTML: attributes => {
            return {
                'data-severity': attributes.severity,
            }
        }
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span.proactive-warning',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setWarningMark:
        attributes =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes)
        },
      unsetWarningMark:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name)
        },
    }
  },
})
