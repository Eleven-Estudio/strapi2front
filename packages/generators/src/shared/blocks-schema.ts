/**
 * Zod Schema for Strapi Blocks (Rich Text Editor v5)
 *
 * This schema validates the JSON structure of Strapi's Blocks field type.
 * The Blocks editor produces a structured JSON format that can be validated
 * and rendered using @strapi/blocks-react-renderer or similar libraries.
 *
 * @see https://github.com/strapi/blocks-react-renderer
 * @see https://docs.strapi.io/cms/features/content-type-builder
 */

/**
 * Generate the Zod schema string for Strapi Blocks content.
 *
 * The schema defines all possible block types:
 * - paragraph: Basic text block
 * - heading: Headings h1-h6
 * - list: Ordered and unordered lists
 * - quote: Block quotes
 * - code: Code blocks
 * - image: Image blocks with media reference
 *
 * Text nodes can have modifiers: bold, italic, underline, strikethrough, code
 */
export function generateBlocksSchemaString(): string {
  return `
// Text node with optional formatting modifiers
const textNodeSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  strikethrough: z.boolean().optional(),
  code: z.boolean().optional(),
});

// Link node (inline element)
const linkNodeSchema = z.object({
  type: z.literal('link'),
  url: z.string().url(),
  children: z.array(textNodeSchema),
});

// Inline content can be text or links
const inlineNodeSchema = z.union([textNodeSchema, linkNodeSchema]);

// List item node
const listItemNodeSchema = z.object({
  type: z.literal('list-item'),
  children: z.array(inlineNodeSchema),
});

// Paragraph block
const paragraphBlockSchema = z.object({
  type: z.literal('paragraph'),
  children: z.array(inlineNodeSchema),
});

// Heading block (levels 1-6)
const headingBlockSchema = z.object({
  type: z.literal('heading'),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
  children: z.array(inlineNodeSchema),
});

// List block (ordered or unordered)
const listBlockSchema = z.object({
  type: z.literal('list'),
  format: z.enum(['ordered', 'unordered']),
  children: z.array(listItemNodeSchema),
});

// Quote block
const quoteBlockSchema = z.object({
  type: z.literal('quote'),
  children: z.array(inlineNodeSchema),
});

// Code block
const codeBlockSchema = z.object({
  type: z.literal('code'),
  children: z.array(textNodeSchema),
});

// Image block
const imageBlockSchema = z.object({
  type: z.literal('image'),
  image: z.object({
    name: z.string(),
    alternativeText: z.string().nullable().optional(),
    url: z.string(),
    caption: z.string().nullable().optional(),
    width: z.number().positive(),
    height: z.number().positive(),
    formats: z.record(z.unknown()).nullable().optional(),
    hash: z.string(),
    ext: z.string(),
    mime: z.string(),
    size: z.number().positive(),
    previewUrl: z.string().nullable().optional(),
    provider: z.string(),
  }),
  children: z.array(z.object({ type: z.literal('text'), text: z.string() })),
});

// All possible block types
const blockSchema = z.discriminatedUnion('type', [
  paragraphBlockSchema,
  headingBlockSchema,
  listBlockSchema,
  quoteBlockSchema,
  codeBlockSchema,
  imageBlockSchema,
]);

// BlocksContent is an array of blocks
const blocksContentSchema = z.array(blockSchema);
`.trim();
}

/**
 * Get the inline Zod schema for blocks field (simpler version)
 * Use this when you don't want to define all the helper schemas
 */
export function getBlocksZodSchema(): string {
  return 'z.array(z.object({ type: z.string(), children: z.array(z.unknown()).optional() }).passthrough())';
}

/**
 * Get the full Zod schema variable name for blocks
 * This assumes the schema has been defined using generateBlocksSchemaString()
 */
export function getBlocksSchemaReference(): string {
  return 'blocksContentSchema';
}

/**
 * Compact inline version of blocks schema
 * More strict than passthrough but still inline-able
 */
export function getCompactBlocksSchema(): string {
  return `z.array(
  z.discriminatedUnion('type', [
    z.object({ type: z.literal('paragraph'), children: z.array(z.object({ type: z.literal('text'), text: z.string() }).passthrough()) }),
    z.object({ type: z.literal('heading'), level: z.number().int().min(1).max(6), children: z.array(z.object({ type: z.literal('text'), text: z.string() }).passthrough()) }),
    z.object({ type: z.literal('list'), format: z.enum(['ordered', 'unordered']), children: z.array(z.object({ type: z.literal('list-item'), children: z.array(z.unknown()) })) }),
    z.object({ type: z.literal('quote'), children: z.array(z.object({ type: z.literal('text'), text: z.string() }).passthrough()) }),
    z.object({ type: z.literal('code'), children: z.array(z.object({ type: z.literal('text'), text: z.string() })) }),
    z.object({ type: z.literal('image'), image: z.object({ url: z.string(), width: z.number(), height: z.number() }).passthrough(), children: z.array(z.unknown()) }),
  ])
)`;
}
