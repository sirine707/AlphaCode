import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Function to recursively get all file paths in a directory, ignoring common large/irrelevant directories
async function getFilePaths(dir: string, rootDir: string): Promise<string[]> {
  try {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      dirents.map(async (dirent) => {
        const res = path.resolve(dir, dirent.name);
        const relativePath = path.relative(rootDir, res);

        // Ignore node_modules, .git, .next, and other irrelevant paths
        if (
          [
            "node_modules",
            ".git",
            ".next",
            "public",
            "out",
            ".env",
            ".env.local",
            ".env.production",
            ".env.development",
          ].includes(dirent.name)
        ) {
          return [];
        }

        if (dirent.isDirectory()) {
          return getFilePaths(res, rootDir);
        } else {
          // We only want to return the relative path
          return [relativePath];
        }
      })
    );
    // Flatten the array of arrays
    return files.flat();
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("Dockerfile generation request received.");
    const { model: modelFromRequest } = await req.json(); // Get model from request

    const projectRoot = process.cwd();
    const allRelativeFiles = await getFilePaths(projectRoot, projectRoot);

    // Prioritize key configuration files
    const keyFiles = [
      "package.json",
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      "tsconfig.json",
      "next.config.ts",
      "next.config.mjs",
      "postcss.config.mjs",
      "tailwind.config.ts",
      // Remove .env files from this list
      "middleware.ts",
      "middleware.js",
    ];

    // Filter for files that actually exist and add some source code files for context
    const existingKeyFiles = (
      await Promise.all(
        keyFiles.map(async (f) => {
          try {
            await fs.access(path.join(projectRoot, f));
            return f;
          } catch {
            return null;
          }
        })
      )
    ).filter((f) => f !== null) as string[];

    const otherSourceFiles = allRelativeFiles
      .filter((f) => f.startsWith("src/") && !existingKeyFiles.includes(f))
      .slice(0, 10); // Limit to 10 other source files for brevity

    const filesToRead = [
      ...new Set([...existingKeyFiles, ...otherSourceFiles]),
    ];

    const systemPrompt = `
You are generating a Dockerfile for a Next.js application. This Dockerfile MUST include Python installation or it will fail to build.

CRITICAL REQUIREMENTS - FAILURE TO FOLLOW WILL CAUSE BUILD ERRORS:

1. MANDATORY: Every stage that runs "npm ci" or "npm install" MUST have this line IMMEDIATELY after WORKDIR:
   RUN apk add --no-cache python3 make g++ gcc musl-dev libc6-compat

2. Use node:22-alpine as base image

3. Create exactly 3 stages:
   - deps: Install production dependencies with Python tools
   - builder: Build application with Python tools  
   - runner: Final runtime (no Python tools needed)

4. Next.js standalone configuration:
   - Copy from builder: /app/.next/standalone -> ./
   - Copy from builder: /app/.next/static -> ./.next/static
   - Copy from builder: /app/public -> ./public
   - Use CMD ["node", "server.js"]

5. Security: Create nextjs:nodejs user (uid:gid 1001) in runner stage only

EXACT TEMPLATE TO FOLLOW:

FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++ gcc musl-dev libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ gcc musl-dev libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]

CRITICAL: If you do not include "RUN apk add --no-cache python3 make g++ gcc musl-dev libc6-compat" in both deps and builder stages, the build WILL FAIL with Python errors.

Output only the raw Dockerfile content without explanations or markdown.
`;

    let fileContext = "Here is the project context:\n\n";
    fileContext +=
      "File structure overview:\n" +
      allRelativeFiles.slice(0, 50).join("\n") +
      "\n\n"; // Show a snapshot of the file tree

    for (const relativePath of filesToRead) {
      try {
        const fullPath = path.join(projectRoot, relativePath);
        const content = await fs.readFile(fullPath, "utf-8");
        fileContext += `--- FILE: ${relativePath} ---\n${content.slice(
          0,
          2000
        )}\n\n`; // Limit content length
      } catch (readError) {
        console.warn(`Could not read file ${relativePath}:`, readError);
      }
    }

    const model = modelFromRequest || "qwen/qwen-2.5-coder-32b-instruct:free"; // Use model from request or default
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    if (!openRouterApiKey) {
      console.error("OPENROUTER_API_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error: Missing API key." },
        { status: 500 }
      );
    }

    const fullPrompt = `${systemPrompt}\n\n${fileContext}`;

    console.log(`Sending request to model ${model}...`);
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: fullPrompt }],
          max_tokens: 2048,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error from OpenRouter:", response.status, errorText);
      return NextResponse.json(
        { error: `Failed to generate Dockerfile. Status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    let dockerfileContent = data.choices[0].message.content;

    // Clean up markdown code block markers that the AI might include despite instructions
    if (dockerfileContent.includes("```")) {
      console.log("Cleaning up markdown code block markers from Dockerfile");
      // Remove ```dockerfile or ```Dockerfile at the start
      dockerfileContent = dockerfileContent.replace(
        /^```[Dd]ockerfile\s*\n?/gm,
        ""
      );
      // Remove ``` at the end
      dockerfileContent = dockerfileContent.replace(/\n?```\s*$/gm, "");
      // Remove any remaining ``` markers
      dockerfileContent = dockerfileContent.replace(/```/g, "");
    }

    // Trim any extra whitespace
    dockerfileContent = dockerfileContent.trim();

    console.log("Successfully generated Dockerfile.");
    // Return both the generated Dockerfile and the context/prompt sent to the language model
    return NextResponse.json({
      dockerfile: dockerfileContent,
      prompt: fullPrompt,
    });
  } catch (error) {
    console.error("Error generating Dockerfile:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
