export interface BrowserToolSchema {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties?: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
}

export const browserToolSchemas: BrowserToolSchema[] = [
  {
    name: "browser.open",
    description: "Open an allowed external web page in Portal Desktop.",
    input_schema: {
      type: "object",
      properties: {
        url: { type: "string", description: "The URL to open" }
      },
      required: ["url"]
    }
  },
  {
    name: "browser.get_state",
    description: "Get current page title, url, text, inputs, buttons and links.",
    input_schema: { type: "object" }
  },
  {
    name: "browser.screenshot",
    description: "Capture screenshot of current page.",
    input_schema: { type: "object" }
  },
  {
    name: "browser.click",
    description: "Click page element by CSS selector.",
    input_schema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "CSS selector of the element to click" }
      },
      required: ["selector"]
    }
  },
  {
    name: "browser.type",
    description: "Type text into input or textarea by CSS selector.",
    input_schema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "CSS selector of the target element" },
        text: { type: "string", description: "Text to type" }
      },
      required: ["selector", "text"]
    }
  },
  {
    name: "browser.back",
    description: "Navigate back in browser history.",
    input_schema: { type: "object" }
  },
  {
    name: "browser.forward",
    description: "Navigate forward in browser history.",
    input_schema: { type: "object" }
  },
  {
    name: "browser.reload",
    description: "Reload the current page.",
    input_schema: { type: "object" }
  },
  {
    name: "browser.extract_table",
    description: "Extract table data by CSS selector.",
    input_schema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "CSS selector of the table element" }
      },
      required: ["selector"]
    }
  }
];
