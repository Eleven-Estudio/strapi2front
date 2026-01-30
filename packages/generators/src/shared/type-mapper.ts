/**
 * Type mapping utilities
 * Shared logic for converting Strapi attributes to TypeScript/JSDoc types
 */

import type { Attribute, ComponentType } from '@strapi2front/core';
import { toPascalCase } from '../utils/naming.js';

/**
 * Mapped type information
 */
export interface MappedType {
  /** The type string (e.g., "string", "number", "Article") */
  type: string;
  /** Whether this type needs an import */
  needsImport: boolean;
  /** Import details if needed */
  import?: {
    name: string;
    from: string;
    isRelation?: boolean;
    isComponent?: boolean;
  };
}

/**
 * Convert Strapi attribute to type string
 */
export function mapAttributeToType(attr: Attribute, _components: ComponentType[]): MappedType {
  switch (attr.type) {
    case 'string':
    case 'text':
    case 'richtext':
    case 'email':
    case 'password':
    case 'uid':
      return { type: 'string', needsImport: false };

    case 'blocks':
      return {
        type: 'BlocksContent',
        needsImport: true,
        import: { name: 'BlocksContent', from: 'utils' }
      };

    case 'integer':
    case 'biginteger':
    case 'float':
    case 'decimal':
      return { type: 'number', needsImport: false };

    case 'boolean':
      return { type: 'boolean', needsImport: false };

    case 'date':
    case 'time':
    case 'datetime':
    case 'timestamp':
      return { type: 'string', needsImport: false };

    case 'json':
      return { type: 'unknown', needsImport: false };

    case 'enumeration':
      if ('enum' in attr && attr.enum) {
        return {
          type: attr.enum.map((v) => `'${v}'`).join(' | '),
          needsImport: false
        };
      }
      return { type: 'string', needsImport: false };

    case 'media':
      if ('multiple' in attr && attr.multiple) {
        return {
          type: 'StrapiMedia[]',
          needsImport: true,
          import: { name: 'StrapiMedia', from: 'utils' }
        };
      }
      return {
        type: 'StrapiMedia | null',
        needsImport: true,
        import: { name: 'StrapiMedia', from: 'utils' }
      };

    case 'relation':
      if ('target' in attr && attr.target) {
        const targetName = attr.target.split('.').pop() || 'unknown';
        const typeName = toPascalCase(targetName);
        const isMany = attr.relation === 'oneToMany' || attr.relation === 'manyToMany';
        return {
          type: isMany ? `${typeName}[]` : `${typeName} | null`,
          needsImport: true,
          import: { name: typeName, from: targetName, isRelation: true }
        };
      }
      return { type: 'unknown', needsImport: false };

    case 'component':
      if ('component' in attr && attr.component) {
        const componentName = attr.component.split('.').pop() || 'unknown';
        const typeName = toPascalCase(componentName);
        if ('repeatable' in attr && attr.repeatable) {
          return {
            type: `${typeName}[]`,
            needsImport: true,
            import: { name: typeName, from: componentName, isComponent: true }
          };
        }
        return {
          type: `${typeName} | null`,
          needsImport: true,
          import: { name: typeName, from: componentName, isComponent: true }
        };
      }
      return { type: 'unknown', needsImport: false };

    case 'dynamiczone':
      if ('components' in attr && attr.components) {
        const types = attr.components.map((c) => {
          const name = c.split('.').pop() || 'unknown';
          return toPascalCase(name);
        });
        return {
          type: `(${types.join(' | ')})[]`,
          needsImport: true,
          // Dynamic zones need multiple imports, handled separately
        };
      }
      return { type: 'unknown[]', needsImport: false };

    default:
      return { type: 'unknown', needsImport: false };
  }
}

/**
 * Get JSDoc type annotation for an attribute
 */
export function getJSDocType(mappedType: MappedType): string {
  return mappedType.type;
}

/**
 * Get attribute comment/description
 */
export function getAttributeComment(attr: Attribute): string | null {
  const parts: string[] = [];

  if (attr.required) {
    parts.push('Required');
  }

  if ('minLength' in attr && attr.minLength !== undefined) {
    parts.push(`Min length: ${attr.minLength}`);
  }

  if ('maxLength' in attr && attr.maxLength !== undefined) {
    parts.push(`Max length: ${attr.maxLength}`);
  }

  if ('min' in attr && attr.min !== undefined) {
    parts.push(`Min: ${attr.min}`);
  }

  if ('max' in attr && attr.max !== undefined) {
    parts.push(`Max: ${attr.max}`);
  }

  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Extract all dependencies (relations and components) from attributes
 */
export function extractDependencies(
  attributes: Record<string, Attribute>,
  selfName: string
): { relations: Set<string>; components: Set<string> } {
  const relations = new Set<string>();
  const components = new Set<string>();

  for (const attr of Object.values(attributes)) {
    if (attr.type === 'relation' && 'target' in attr && attr.target) {
      const targetName = attr.target.split('.').pop() || '';
      const typeName = toPascalCase(targetName);
      // Don't import self
      if (typeName !== selfName && targetName) {
        relations.add(targetName);
      }
    }

    if (attr.type === 'component' && 'component' in attr && attr.component) {
      const componentName = attr.component.split('.').pop() || '';
      if (componentName) {
        components.add(componentName);
      }
    }

    if (attr.type === 'dynamiczone' && 'components' in attr && attr.components) {
      for (const comp of attr.components) {
        const componentName = comp.split('.').pop() || '';
        if (componentName) {
          components.add(componentName);
        }
      }
    }
  }

  return { relations, components };
}
