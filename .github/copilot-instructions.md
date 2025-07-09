# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a multi-tool web application built with Next.js 14+ and TypeScript. The app provides various utility tools including:

- **Image Processing**: Background removal, format conversion, resizing
- **Document Conversion**: PDF ↔ Word conversion
- **Audio Tools**: MP3 download from URLs, audio editing and conversion
- **Video Tools**: Basic video processing and conversion

## Tech Stack
- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui components
- **Backend**: Next.js API routes
- **File Processing**: Sharp (images), pdf-lib (PDFs), fluent-ffmpeg (audio/video)
- **Styling**: Tailwind CSS with dark/light mode support

## Code Guidelines
- Use TypeScript strictly with proper type definitions
- Follow Next.js 14+ App Router patterns
- Implement proper error handling for file processing
- Use server actions for file uploads and processing
- Implement progress indicators for long-running tasks
- Follow accessibility best practices
- Use Tailwind utility classes for styling
- Implement proper SEO with metadata API

## File Structure
- `/src/app` - App Router pages and layouts
- `/src/components` - Reusable UI components
- `/src/lib` - Utility functions and configurations
- `/src/types` - TypeScript type definitions
- `/public` - Static assets
- `/api` - API route handlers for tool functionality

## Features to Implement
1. **Image Tools**: Background removal, format conversion, compression
2. **Document Tools**: PDF/Word conversion, text extraction
3. **Audio Tools**: Download from URLs, format conversion, basic editing
4. **Video Tools**: Format conversion, basic trimming
5. **File Management**: Upload handling, progress tracking, download management
