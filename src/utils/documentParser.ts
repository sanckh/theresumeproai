import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';
import { classifyResumeSection } from './openai';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Common section detection logic used by both PDF and DOCX parsers
function isHeading(text: string, fontSize?: number, isStyleHeading?: boolean): { isHeading: boolean; type?: string } {
  if (!text || text.length < 2) return { isHeading: false };
  
  const text_lower = text.toLowerCase().trim();
  
  // Ignore contact information
  if (/^[\d\s-+().]+$/.test(text)) return { isHeading: false }; // Phone numbers
  if (/@/.test(text)) return { isHeading: false }; // Email addresses
  if (/^[a-z\s]+,\s*[a-z]{2}$/i.test(text)) return { isHeading: false }; // City, State
  
  // Ignore date ranges
  if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec).*\d{4}/i.test(text_lower)) return { isHeading: false };
  if (/\d{4}\s*(-|–|to)\s*(present|\d{4})/i.test(text)) return { isHeading: false };
  
  // Common section headers
  const commonSections = [
    'skills',
    'experience',
    'education',
    'summary',
    'work history',
    'employment',
    'certifications',
    'projects',
    'publications',
    'awards',
    'languages',
    'interests'
  ];

  // Check if this is a common section header
  if (commonSections.includes(text_lower)) {
    return { isHeading: true, type: text };
  }

  // Skill categories are often followed by a colon
  if (text.includes(':')) {
    const beforeColon = text.split(':')[0].trim();
    // Skill categories are usually 1-4 words
    if (beforeColon.split(/\s+/).length <= 4 && /^[A-Z]/.test(beforeColon)) {
      return { isHeading: false }; // It's a skill category, not a main section
    }
  }
  
  // Structural patterns that indicate a heading
  const isAllCaps = text === text.toUpperCase();
  const isShortPhrase = text.split(/\s+/).length <= 4;
  const hasNoEndPunctuation = !text.endsWith('.') && !text.endsWith(',');
  const startsWithCapital = /^[A-Z]/.test(text);
  const isOneWord = text.split(/\s+/).length === 1;
  const hasNoNumbers = !/\d/.test(text);
  
  // For DOCX files that have explicit heading styles
  if (isStyleHeading) {
    return { isHeading: true, type: text };
  }
  
  // For plain text or when no style/font info is available
  // More strict requirements when we don't have style information
  if (isAllCaps && 
      isShortPhrase && 
      hasNoEndPunctuation &&
      !text.includes(':') &&
      hasNoNumbers) {
    return { isHeading: true, type: text };
  }

  return { isHeading: false };
}

// Helper function to process sections for both PDF and DOCX
async function processSections(sections: { content: string; type: string }[]): Promise<string> {
  console.log('\nParsed Sections:');
  console.log('='.repeat(100));
  
  // Pre-process sections to separate summary from header
  const processedSections: { content: string; type: string }[] = [];
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const content = section.content.trim();
    
    if (section.type.toLowerCase() === 'header') {
      // Split header content into lines
      const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
      
      const headerLines: string[] = [];
      const summaryLines: string[] = [];
      let isInSummary = false;
      
      for (const line of lines) {
        // Check if this line starts a summary section
        if (line.includes('years of experience') || 
            line.includes('expertise in') || 
            line.includes('-driven') ||
            line.length > 50) {
          isInSummary = true;
        }
        
        if (isInSummary) {
          summaryLines.push(line);
        } else {
          headerLines.push(line);
        }
      }
      
      // Add header section
      if (headerLines.length > 0) {
        processedSections.push({
          type: 'Header',
          content: headerLines.join('\n')
        });
      }
      
      // Add summary section if found
      if (summaryLines.length > 0) {
        processedSections.push({
          type: 'Summary',
          content: summaryLines.join('\n')
        });
      }
    } else if (section.type.toLowerCase() === 'education' && content.toLowerCase().includes('published author')) {
      // Split education and miscellaneous content
      const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
      const educationLines: string[] = [];
      const miscLines: string[] = [];
      let isInMisc = false;
      
      for (const line of lines) {
        if (line.toLowerCase().includes('published author') || 
            line.toLowerCase().includes('miscellaneous')) {
          isInMisc = true;
        }
        
        if (isInMisc) {
          miscLines.push(line);
        } else {
          educationLines.push(line);
        }
      }
      
      // Add education section
      if (educationLines.length > 0) {
        processedSections.push({
          type: 'Education',
          content: educationLines.join('\n')
        });
      }
      
      // Add miscellaneous section
      if (miscLines.length > 0) {
        processedSections.push({
          type: 'Miscellaneous',
          content: miscLines.join('\n')
        });
      }
    } else {
      processedSections.push(section);
    }
  }
  
  const mergedSections = await mergeSections(processedSections);
  
  let output = '';
  for (const section of mergedSections) {
    // Add section header with proper formatting
    output += `\n${section.type.toUpperCase()}\n${'='.repeat(section.type.length)}\n`;
    
    // Format content based on section type
    const content = formatSectionContent(section.type, section.content);
    output += content + '\n';

    // Debug logging
    console.log(`Section Type: ${section.type}`);
    console.log('-'.repeat(50));
    console.log(content);
    console.log('='.repeat(100));
  }
  
  return output.trim();
}

// Helper function to format section content
function formatSectionContent(type: string, content: string): string {
  const lines = content.split('\n').filter(line => line.trim());
  
  // Helper to check if a line is contact info based on structure
  const isContactInfo = (line: string): boolean => {
    const words = line.split(/\s+/);
    return (
      line.includes('@') || // email
      !!line.match(/^\d{3}[-.]?\d{3}[-.]?\d{4}$/) || // phone
      !!line.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*[A-Z]{2}$/) || // city, state
      (words.length <= 3 && words.every(word => /^[A-Z][a-z]*$/.test(word))) // name or short location
    );
  };

  // Helper to check if a line is part of a summary based on structure
  const isSummaryContent = (line: string): boolean => {
    const words = line.split(/\s+/);
    return (
      line.length > 50 && // Long descriptive lines
      !line.includes(':') && // Not a label
      !/^\d{4}/.test(line) && // Not a date
      !/^[A-Z][a-z]+:/.test(line) // Not a section header
    );
  };

  // Helper to check if a line starts a new entry
  const isEntryStart = (line: string): boolean => {
    return (
      /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/.test(line) || // Date start
      /^\d{4}\s*[-–]\s*(?:\d{4}|Present)/.test(line) || // Year range
      /^[A-Z][^a-z:]+$/.test(line) // All caps header
    );
  };

  switch (type.toLowerCase()) {
    case 'header': {
      // Keep only contact information
      return lines
        .filter(line => isContactInfo(line))
        .join('\n');
    }
    
    case 'summary': {
      // Keep professional summary content
      return lines
        .filter(line => isSummaryContent(line) && !isContactInfo(line))
        .join('\n');
    }
    
    case 'skills': {
      // Group skills by category
      let currentCategory = '';
      return lines
        .map(line => {
          if (line.match(/^[A-Z][^:]+:?$/)) {
            currentCategory = line;
            return `\n${line}`;
          }
          return line;
        })
        .join('\n')
        .trim();
    }
    
    case 'experience': {
      // Preserve structure of experience entries
      return lines
        .map((line, i) => {
          if (i > 0 && isEntryStart(line)) {
            return `\n${line}`;
          }
          return line;
        })
        .join('\n');
    }
    
    case 'education': {
      // Group education entries
      return lines
        .filter(line => !line.match(/^(?:Published|Author)/i))
        .map((line, i) => {
          if (i > 0 && isEntryStart(line)) {
            return `\n${line}`;
          }
          return line;
        })
        .join('\n');
    }
    
    case 'miscellaneous': {
      // Keep achievements and publications
      return lines
        .filter(line => line.match(/^(?:Published|Author)/i))
        .join('\n');
    }
    
    default: {
      return lines.join('\n');
    }
  }
}

// Helper function to merge sections that were incorrectly split
async function mergeSections(sections: { content: string; type: string }[]): Promise<{ content: string; type: string }[]> {
  const merged: { content: string; type: string }[] = [];
  let current: { content: string; type: string } | null = null;
  let context = sections.slice(0, 3).map(s => s.type).join(' ');
  let lastClassification: { sectionType: string; confidence: number } | null = null;

  for (const section of sections) {
    try {
      // Get AI classification for this section
      const classification = await classifyResumeSection(
        section.type + '\n' + section.content,
        context
      );

      // Update context window with recent sections
      context = [context, section.type].join(' ').split(' ').slice(-10).join(' ');

      // Helper function to format section content
      const formatContent = (type: string, existingContent: string, newType: string, newContent: string) => {
        // Remove duplicate section names
        const typeToRemove = new RegExp(`^${type}\\s*`, 'i');
        const cleanNewType = newType.replace(typeToRemove, '').trim();
        const cleanNewContent = newContent.trim();

        // Special handling for dates and locations
        const isDateOrLocation = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4}|present)/i.test(cleanNewContent);
        
        if (existingContent.trim()) {
          return isDateOrLocation
            ? `${existingContent}\n${cleanNewContent}`
            : `${existingContent}\n${cleanNewType ? cleanNewType + '\n' : ''}${cleanNewContent}`;
        } else {
          return `${cleanNewType ? cleanNewType + '\n' : ''}${cleanNewContent}`;
        }
      };

      // Start new section if:
      // 1. No current section exists
      // 2. High confidence classification different from last section
      // 3. Medium confidence but significantly different from last section
      const shouldStartNewSection = !current || 
        (classification.confidence > 0.7 && (!lastClassification || lastClassification.sectionType !== classification.sectionType)) ||
        (classification.confidence > 0.5 && lastClassification && lastClassification.sectionType !== classification.sectionType);

      if (shouldStartNewSection) {
        if (current) {
          merged.push(current);
        }
        current = {
          type: classification.sectionType.charAt(0).toUpperCase() + classification.sectionType.slice(1),
          content: formatContent(classification.sectionType, '', section.type, section.content)
        };
      } else {
        // Merge with current section
        if (current) {
          current.content = formatContent(current.type, current.content, section.type, section.content);
        }
      }

      lastClassification = classification;

    } catch (error) {
      console.error('Error in section classification:', error);
      // Fallback: append to current section if exists, otherwise create new
      if (current) {
        current.content += '\n' + section.content;
      } else {
        current = { ...section };
      }
    }
  }

  if (current) {
    merged.push(current);
  }

  return merged;
}

export async function parseDocument(file: File): Promise<string> {
  const fileType = file.type;
  
  switch (fileType) {
    case 'application/pdf':
      return await parsePDF(file);
    case 'application/msword': // DOC files
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': // DOCX files
      return await parseDocx(file);
    case 'text/plain':
      return await file.text();
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

async function parsePDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const textItems: { text: string; y: number }[] = [];
  
  // Extract text items from all pages
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    textContent.items.forEach((item: TextItem | TextMarkedContent) => {
      if ('str' in item && 'transform' in item) {
        const text = item.str.trim();
        if (text) {
          textItems.push({
            text,
            y: item.transform[5]
          });
        }
      }
    });
  }

  // Sort by vertical position
  textItems.sort((a, b) => a.y - b.y);

  // Group text into sections
  const parsedSections: { content: string; type: string }[] = [];
  let currentSection: string[] = [];
  let currentType = 'Header';
  let lastY = textItems[0]?.y;
  const lineSpacing = 15;

  textItems.forEach((item, index) => {
    const text = item.text.trim();
    if (!text) return;

    const yGap = Math.abs(item.y - lastY);
    const isNewParagraph = yGap > lineSpacing;

    // Check if this is a heading
    const headingResult = isHeading(text);

    if (headingResult.isHeading) {
      // Save current section if it has content
      if (currentSection.length > 0) {
        parsedSections.push({
          content: currentSection.join(' '),
          type: currentType
        });
        currentSection = [];
      }
      currentType = headingResult.type || text;
    } else {
      if (isNewParagraph && currentSection.length > 0) {
        currentSection.push('\n');
      }
      currentSection.push(text);
    }

    lastY = item.y;

    // Handle last section
    if (index === textItems.length - 1 && currentSection.length > 0) {
      parsedSections.push({
        content: currentSection.join(' '),
        type: currentType
      });
    }
  });

  const mergedSections = await mergeSections(parsedSections);
  const structuredText = await processSections(mergedSections);

  return JSON.stringify({
    content: structuredText.trim(),
    metadata: {
      sections: mergedSections.length,
      hasBulletPoints: structuredText.includes('•') || structuredText.includes('-'),
      totalLength: structuredText.length
    }
  });
}

async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Get both raw text and style information
  const [textResult, styleResult] = await Promise.all([
    mammoth.extractRawText({ arrayBuffer }),
    mammoth.convertToHtml({ arrayBuffer })
  ]);

  const rawText = textResult.value;
  const htmlContent = styleResult.value;

  // Split text into lines and detect sections
  const lines = rawText.split('\n').map(line => line.trim()).filter(line => line);
  const parsedSections: { content: string; type: string }[] = [];
  let currentSection: string[] = [];
  let currentType = 'Header';

  // Use HTML content to detect headings (elements with heading styles)
  const headingMatches = htmlContent.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/g) || [];
  const headings = new Set(headingMatches.map(match => {
    const content = match.replace(/<[^>]+>/g, '').trim();
    return content.toLowerCase();
  }));

  lines.forEach((line, index) => {
    // Check if this line is a heading
    const isStyleHeading = headings.has(line.toLowerCase());
    const headingResult = isHeading(line, undefined, isStyleHeading);
    
    if (headingResult.isHeading) {
      // Save current section if it has content
      if (currentSection.length > 0) {
        parsedSections.push({
          content: currentSection.join('\n'),
          type: currentType
        });
        currentSection = [];
      }
      currentType = headingResult.type || line;
    } else {
      currentSection.push(line);
    }

    // Handle last section
    if (index === lines.length - 1 && currentSection.length > 0) {
      parsedSections.push({
        content: currentSection.join('\n'),
        type: currentType
      });
    }
  });

  const mergedSections = await mergeSections(parsedSections);
  const structuredText = await processSections(mergedSections);

  return JSON.stringify({
    content: structuredText.trim(),
    metadata: {
      sections: mergedSections.length,
      hasBulletPoints: structuredText.includes('•') || structuredText.includes('-'),
      totalLength: structuredText.length
    }
  });
}
