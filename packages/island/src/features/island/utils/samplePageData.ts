/**
 * Sample data seeder for creating demo pages with various block types
 * Use this to quickly populate a page with sample content for testing
 */

import { BlockType } from "@/types/types";

interface SampleBlock {
  type: BlockType;
  content: any;
  properties?: any;
  parentId?: string;
}

/**
 * Generate a complete sample page with all block types
 */
export const generateSamplePage = (): SampleBlock[] => {
  return [
    // Header section
    {
      type: "heading_1",
      content: "Welcome to Your Island Page 🏝️",
    },
    {
      type: "paragraph",
      content:
        "This is a Notion-like page system where you can create rich content with multiple block types. Try editing any text by clicking on it!",
    },

    // Callout
    {
      type: "callout",
      content:
        "This is a callout block - perfect for highlighting important information!",
      properties: {
        icon: "💡",
        backgroundColor: "bg-blue-900/20",
      },
    },

    // Text blocks
    {
      type: "heading_2",
      content: "Text Formatting",
    },
    {
      type: "paragraph",
      content:
        "You can write paragraphs with regular text. Click to start editing!",
    },
    {
      type: "quote",
      content:
        "Block quotes are perfect for highlighting important quotes or testimonials.",
    },

    // Lists
    {
      type: "heading_2",
      content: "Lists & Tasks",
    },
    {
      type: "bulleted_list",
      content: "This is a bullet point",
    },
    {
      type: "bulleted_list",
      content: "You can create multiple items",
    },
    {
      type: "bulleted_list",
      content: "Great for unordered lists",
    },
    {
      type: "numbered_list",
      content: "First step in a process",
    },
    {
      type: "numbered_list",
      content: "Second step follows naturally",
    },
    {
      type: "numbered_list",
      content: "Third step completes the sequence",
    },
    {
      type: "todo",
      content: "Completed task",
      properties: { checked: true },
    },
    {
      type: "todo",
      content: "Pending task",
      properties: { checked: false },
    },
    {
      type: "todo",
      content: "Another task to do",
      properties: { checked: false },
    },

    // Toggle
    {
      type: "toggle",
      content: "Click to expand this toggle",
    },

    // Divider
    {
      type: "divider",
      content: null,
    },

    // Code
    {
      type: "heading_2",
      content: "Code Snippets",
    },
    {
      type: "code",
      content: `function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return \`Welcome to the island!\`;
}

greet('Explorer');`,
      properties: {
        language: "javascript",
      },
    },

    // Media section
    {
      type: "heading_2",
      content: "Media & Files",
    },
    {
      type: "paragraph",
      content:
        "You can embed images, videos, audio files, and other attachments (add URLs to see them):",
    },
    {
      type: "image",
      content: "",
      properties: {
        caption: "Add an image URL to display it here",
      },
    },

    // Table
    {
      type: "heading_2",
      content: "Tables",
    },
    {
      type: "table",
      content: {
        rows: [
          ["Feature", "Status", "Priority"],
          ["Text blocks", "✅ Done", "High"],
          ["Media support", "✅ Done", "High"],
          ["Tables", "✅ Done", "Medium"],
          ["Drag & drop", "🚧 Coming", "Low"],
        ],
      },
      properties: {
        hasHeader: true,
        columnCount: 3,
        rowCount: 5,
      },
    },

    // Advanced
    {
      type: "divider",
      content: null,
    },
    {
      type: "heading_2",
      content: "More Features",
    },
    {
      type: "bookmark",
      content: "https://notion.so",
      properties: {
        title: "Notion - The all-in-one workspace",
        description: "A new tool that blends your everyday work apps into one.",
      },
    },

    // Footer
    {
      type: "divider",
      content: null,
    },
    {
      type: "paragraph",
      content:
        "🎉 You now have a fully functional Notion-like page! Start customizing it to fit your needs.",
    },
  ];
};

/**
 * Generate a simple page template
 */
export const generateSimplePage = (): SampleBlock[] => {
  return [
    {
      type: "heading_1",
      content: "Untitled",
    },
    {
      type: "paragraph",
      content: "Start writing...",
    },
  ];
};

/**
 * Generate a task list template
 */
export const generateTaskListTemplate = (): SampleBlock[] => {
  return [
    {
      type: "heading_1",
      content: "Task List",
    },
    {
      type: "paragraph",
      content: "Track your tasks and to-dos:",
    },
    {
      type: "todo",
      content: "Task 1",
      properties: { checked: false },
    },
    {
      type: "todo",
      content: "Task 2",
      properties: { checked: false },
    },
    {
      type: "todo",
      content: "Task 3",
      properties: { checked: false },
    },
  ];
};

/**
 * Generate a documentation template
 */
export const generateDocTemplate = (): SampleBlock[] => {
  return [
    {
      type: "heading_1",
      content: "Documentation",
    },
    {
      type: "callout",
      content: "Overview of this document",
      properties: {
        icon: "📋",
        backgroundColor: "bg-blue-900/20",
      },
    },
    {
      type: "heading_2",
      content: "Getting Started",
    },
    {
      type: "paragraph",
      content: "Introduction text here...",
    },
    {
      type: "heading_3",
      content: "Prerequisites",
    },
    {
      type: "bulleted_list",
      content: "Requirement 1",
    },
    {
      type: "bulleted_list",
      content: "Requirement 2",
    },
    {
      type: "heading_3",
      content: "Installation",
    },
    {
      type: "numbered_list",
      content: "Step 1",
    },
    {
      type: "numbered_list",
      content: "Step 2",
    },
    {
      type: "code",
      content: "// Code example here",
      properties: { language: "javascript" },
    },
  ];
};

/**
 * Generate a meeting notes template
 */
export const generateMeetingNotesTemplate = (): SampleBlock[] => {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return [
    {
      type: "heading_1",
      content: "Meeting Notes",
    },
    {
      type: "paragraph",
      content: `📅 ${today}`,
    },
    {
      type: "heading_2",
      content: "Attendees",
    },
    {
      type: "bulleted_list",
      content: "Person 1",
    },
    {
      type: "bulleted_list",
      content: "Person 2",
    },
    {
      type: "heading_2",
      content: "Agenda",
    },
    {
      type: "numbered_list",
      content: "Topic 1",
    },
    {
      type: "numbered_list",
      content: "Topic 2",
    },
    {
      type: "heading_2",
      content: "Discussion",
    },
    {
      type: "paragraph",
      content: "Main points discussed...",
    },
    {
      type: "heading_2",
      content: "Action Items",
    },
    {
      type: "todo",
      content: "Action item 1",
      properties: { checked: false },
    },
    {
      type: "todo",
      content: "Action item 2",
      properties: { checked: false },
    },
  ];
};

/**
 * Seed a page with sample data
 */
export const seedPageWithSampleData = async (
  islandItemId: string,
  template: "full" | "simple" | "tasks" | "docs" | "meeting" = "simple"
): Promise<void> => {
  let blocks: SampleBlock[];

  switch (template) {
    case "full":
      blocks = generateSamplePage();
      break;
    case "tasks":
      blocks = generateTaskListTemplate();
      break;
    case "docs":
      blocks = generateDocTemplate();
      break;
    case "meeting":
      blocks = generateMeetingNotesTemplate();
      break;
    case "simple":
    default:
      blocks = generateSimplePage();
      break;
  }

  // Create blocks sequentially to maintain order
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    try {
      const response = await fetch("/api/item-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          island_item_id: islandItemId,
          type: block.type,
          content: block.content,
          properties: block.properties || null,
          parent_id: block.parentId || null,
          order_index: i,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create block: ${block.type}`);
      }
    } catch (error) {
      console.error(`Error creating block at index ${i}:`, error);
      throw error;
    }
  }

  console.log(`✅ Successfully seeded page with ${blocks.length} blocks`);
};
