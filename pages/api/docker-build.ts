import { NextApiRequest, NextApiResponse } from "next";
import { spawn } from "child_process";

// Function to cleanup local image after successful push
async function cleanupLocalImage(
  imageName: string,
  res: NextApiResponse
): Promise<void> {
  return new Promise((resolve) => {
    console.log("🧹 Starting local image cleanup");
    res.write(`\n🧹 Cleaning up local image ${imageName}...\n`);

    const cleanupProcess = spawn("docker", ["rmi", imageName], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    });

    cleanupProcess.stdout.on("data", (data) => {
      const output = data.toString();
      console.log("🧹 Cleanup stdout:", output.trim());
      res.write(`🧹 ${output}`);
    });

    cleanupProcess.stderr.on("data", (data) => {
      const output = data.toString();
      console.log("🧹 Cleanup stderr:", output.trim());
      res.write(`🧹 ${output}`);
    });

    cleanupProcess.on("close", (code) => {
      console.log("🧹 Cleanup completed with code:", code);
      if (code === 0) {
        res.write("✅ Local image cleaned up successfully\n");
      } else {
        res.write(
          "⚠️ Warning: Could not clean up local image (may not exist)\n"
        );
      }
      resolve();
    });

    cleanupProcess.on("error", (error) => {
      console.error("⚠️ Cleanup error:", error);
      res.write(`⚠️ Cleanup warning: ${error.message}\n`);
      resolve(); // Don't fail the whole process for cleanup issues
    });
  });
}

// Function to push image to Docker Hub
async function pushToDockerHubFunction(
  imageName: string,
  username: string,
  password: string,
  res: NextApiResponse
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    console.log("🐳 Starting Docker Hub push process");
    console.log(
      "🔐 Using Docker login command: docker login -u",
      username,
      "--password-stdin"
    );
    res.write(`\n🐳 Starting Docker Hub login and push...\n`);
    res.write(`🔐 Using: docker login -u ${username} --password-stdin\n`);
    res.write(
      `🔑 Access token/password will be provided via stdin for security\n`
    );

    // First, login to Docker Hub
    const dockerLogin = spawn(
      "docker",
      ["login", "-u", username, "--password-stdin"],
      {
        cwd: process.cwd(),
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    // Send password to stdin
    dockerLogin.stdin.write(password);
    dockerLogin.stdin.end();

    dockerLogin.stdout.on("data", (data) => {
      const output = data.toString();
      console.log("🔐 Docker login stdout:", output.trim());
      res.write(`🔐 ${output}`);
    });

    dockerLogin.stderr.on("data", (data) => {
      const output = data.toString();
      console.log("🔐 Docker login stderr:", output.trim());
      res.write(`🔐 ${output}`);
    });

    dockerLogin.on("close", (loginCode) => {
      console.log("🔐 Docker login completed with code:", loginCode);

      if (loginCode !== 0) {
        console.error("❌ Docker Hub login failed");
        res.write("❌ Docker Hub login failed\n");
        return resolve(false);
      }

      res.write("✅ Successfully logged into Docker Hub\n");
      console.log("✅ Docker Hub login successful");

      // Now push the image
      res.write(`🚀 Pushing image ${imageName} to Docker Hub...\n`);
      console.log("🚀 Starting Docker push");

      const dockerPush = spawn("docker", ["push", imageName], {
        cwd: process.cwd(),
        stdio: ["pipe", "pipe", "pipe"],
      });

      dockerPush.stdout.on("data", (data) => {
        const output = data.toString();
        console.log("📤 Docker push stdout:", output.trim());
        res.write(output);
      });

      dockerPush.stderr.on("data", (data) => {
        const output = data.toString();
        console.log("📤 Docker push stderr:", output.trim());
        res.write(output);
      });

      dockerPush.on("close", (pushCode) => {
        console.log("🚀 Docker push completed with code:", pushCode);

        // Logout after push (cleanup)
        const dockerLogout = spawn("docker", ["logout"], {
          cwd: process.cwd(),
          stdio: ["pipe", "pipe", "pipe"],
        });

        dockerLogout.on("close", (logoutCode) => {
          console.log("🔓 Docker logout completed with code:", logoutCode);
          res.write("🔓 Logged out of Docker Hub\n");
        });

        if (pushCode === 0) {
          res.write(`\n🎉 Successfully pushed ${imageName} to Docker Hub!\n`);
          console.log("✅ Docker Hub push successful");
          resolve(true);
        } else {
          res.write(
            `\n❌ Docker Hub push failed with exit code: ${pushCode}\n`
          );
          console.error("❌ Docker Hub push failed with code:", pushCode);
          resolve(false);
        }
      });

      dockerPush.on("error", (error) => {
        console.error("💥 Docker push error:", error);
        res.write(`\n💥 Docker push error: ${error.message}\n`);
        resolve(false);
      });
    });

    dockerLogin.on("error", (error) => {
      console.error("💥 Docker login error:", error);
      res.write(`\n💥 Docker login error: ${error.message}\n`);
      resolve(false);
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("🔧 Docker build API called");
  console.log("Method:", req.method);
  console.log("Body:", req.body);

  if (req.method !== "POST") {
    console.log("❌ Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    imageName = "my-app:latest",
    dockerfileContent,
    pushToDockerHub = false,
    dockerHubUsername,
    dockerHubPassword,
    skipBuild = false,
    isHostedMode = false,
  } = req.body;
  console.log("🏷️ Image name:", imageName);
  console.log("📄 Dockerfile content provided:", !!dockerfileContent);
  console.log("🐳 Push to Docker Hub:", pushToDockerHub);
  console.log("⏭️ Skip build:", skipBuild);
  console.log("🏠 Hosted mode:", isHostedMode);

  // In hosted mode, Docker Hub credentials are mandatory
  if (isHostedMode && (!dockerHubUsername || !dockerHubPassword)) {
    console.error("❌ Hosted mode requires Docker Hub credentials");
    res.write(
      "❌ Docker Hub credentials are required for hosted applications\n"
    );
    res.write(
      "💡 Built images must be pushed to Docker Hub as they cannot be stored locally on the server\n"
    );
    res.write("🔐 Please provide your Docker Hub username and access token\n");
    return res.end();
  }

  if (pushToDockerHub) {
    console.log("👤 Docker Hub username:", dockerHubUsername);
    console.log("🔐 Docker Hub password provided:", !!dockerHubPassword);
  }

  // Set headers for streaming
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");
  console.log("📡 Headers set for streaming");

  // Send initial message immediately
  res.write("🔧 Docker build API started\n");
  res.write(`🕐 ${new Date().toISOString()}\n`);
  res.write(`🏷️ Building image: ${imageName}\n`);

  // If skipBuild is true and pushToDockerHub is requested, go directly to push
  if (skipBuild && pushToDockerHub && dockerHubUsername && dockerHubPassword) {
    console.log("⏭️ Skipping build, going directly to Docker Hub push");
    res.write(
      "⏭️ Skipping build process, pushing existing image to Docker Hub...\n"
    );

    // Still create .dockerignore for future builds if it doesn't exist
    const fs = require("fs");
    try {
      if (!fs.existsSync(".dockerignore")) {
        console.log("📝 Creating .dockerignore file for future builds");
        res.write("📝 Creating .dockerignore file for future builds...\n");

        const dockerignoreContent = `# Dependency directories
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Next.js build output
.next/
out/

# Environment files
.env*
!.env.example

# Git
.git/
.gitignore

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
.nyc_output/

# Testing
.jest/
test-results/
playwright-report/

# Build artifacts
dist/
build/

# Documentation
README.md
*.md
docs/

# Other
.dockerignore
Dockerfile
docker-compose*.yml
`;

        fs.writeFileSync(".dockerignore", dockerignoreContent);
        res.write("✅ .dockerignore file created successfully\n");
        console.log("✅ .dockerignore file created");
      }
    } catch (error) {
      console.error("⚠️ Error creating .dockerignore:", error);
      res.write(`⚠️ Warning: Could not create .dockerignore: ${error}\n`);
    }

    const pushSuccess = await pushToDockerHubFunction(
      imageName,
      dockerHubUsername,
      dockerHubPassword,
      res
    );

    if (pushSuccess) {
      res.write(`\n🎊 Image ${imageName} pushed to Docker Hub successfully!\n`);
    } else {
      res.write(`\n❌ Docker Hub push failed.\n`);
    }

    return res.end();
  }

  const fs = require("fs");

  // Create .dockerignore file if it doesn't exist
  try {
    if (!fs.existsSync(".dockerignore")) {
      console.log("📝 Creating .dockerignore file (not found)");
      res.write("📝 Creating .dockerignore file to optimize build...\n");

      const dockerignoreContent = `# Dependency directories
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Next.js build output
.next/
out/

# Environment files
.env*
!.env.example

# Git
.git/
.gitignore

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
.nyc_output/

# Testing
.jest/
test-results/
playwright-report/

# Build artifacts
dist/
build/

# Documentation
README.md
*.md
docs/

# Other
.dockerignore
Dockerfile
docker-compose*.yml
`;

      fs.writeFileSync(".dockerignore", dockerignoreContent);
      res.write("✅ .dockerignore file created successfully\n");
      console.log("✅ .dockerignore file created");
    } else {
      console.log("📄 .dockerignore file already exists, using existing");
      res.write("📄 Using existing .dockerignore file\n");
    }
  } catch (error) {
    console.error("⚠️ Error creating .dockerignore:", error);
    res.write(`⚠️ Warning: Could not create .dockerignore: ${error}\n`);
    // Continue with build even if .dockerignore creation fails
  }

  // First, create/update the Dockerfile if content is provided
  if (dockerfileContent) {
    try {
      console.log("📝 Writing Dockerfile to disk");

      // Clean up markdown code block markers that might be in the content
      let cleanDockerfileContent = dockerfileContent;
      if (cleanDockerfileContent.includes("```")) {
        console.log(
          "🧹 Cleaning up markdown code block markers from Dockerfile content"
        );
        // Remove ```dockerfile or ```Dockerfile at the start
        cleanDockerfileContent = cleanDockerfileContent.replace(
          /^```[Dd]ockerfile\s*\n?/gm,
          ""
        );
        // Remove ``` at the end
        cleanDockerfileContent = cleanDockerfileContent.replace(
          /\n?```\s*$/gm,
          ""
        );
        // Remove any remaining ``` markers
        cleanDockerfileContent = cleanDockerfileContent.replace(/```/g, "");
        console.log(
          "🧹 Cleaned content preview:",
          cleanDockerfileContent.substring(0, 200)
        );
      }

      // Trim any extra whitespace
      cleanDockerfileContent = cleanDockerfileContent.trim();

      fs.writeFileSync("Dockerfile", cleanDockerfileContent);
      res.write("✓ Dockerfile created/updated (cleaned)\n");
      console.log("✅ Dockerfile written successfully (cleaned)");
    } catch (error) {
      console.error("❌ Error writing Dockerfile:", error);
      res.write(`✗ Error creating Dockerfile: ${error}\n`);
      return res.end();
    }
  } else {
    res.write("📄 Using existing Dockerfile\n");
    console.log("📄 No Dockerfile content provided, using existing file");
  }

  // Check if Docker is available
  res.write("🔍 Checking Docker availability...\n");
  console.log("🔍 Checking if Docker is available");

  const dockerCheck = spawn("docker", ["--version"], {
    cwd: process.cwd(),
    stdio: ["pipe", "pipe", "pipe"],
  });

  dockerCheck.stdout.on("data", (data) => {
    const output = data.toString();
    console.log("✅ Docker version check output:", output.trim());
    res.write(`✅ Docker found: ${output}`);
  });

  dockerCheck.stderr.on("data", (data) => {
    const output = data.toString();
    console.error("⚠️ Docker version check stderr:", output.trim());
    res.write(`⚠️ Docker stderr: ${output}`);
  });

  dockerCheck.on("close", (code) => {
    console.log("🏁 Docker version check completed with code:", code);

    if (code !== 0) {
      console.error("❌ Docker not available or not running");
      res.write("❌ Docker is not available or not running\n");
      res.write("📋 Please make sure Docker is installed and running\n");
      res.write("📋 Download from: https://docker.com/get-started\n");
      return res.end();
    }

    // Start the actual docker build process
    console.log("🚀 Starting Docker build process");
    res.write(`\n🔨 Starting Docker build for image: ${imageName}\n`);
    res.write(`📝 Command: docker build -t ${imageName} .\n`);
    res.write(`📁 Working directory: ${process.cwd()}\n\n`);

    const dockerBuild = spawn("docker", ["build", "-t", imageName, "."], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    });

    console.log("📡 Docker build process spawned, PID:", dockerBuild.pid);

    // Stream stdout
    dockerBuild.stdout.on("data", (data) => {
      const output = data.toString();
      console.log("📤 Docker stdout:", output.trim());
      res.write(output);
    });

    // Stream stderr
    dockerBuild.stderr.on("data", (data) => {
      const output = data.toString();
      console.log("📤 Docker stderr:", output.trim());
      res.write(output);
    });

    // Handle completion
    dockerBuild.on("close", async (code) => {
      console.log("🏁 Docker build completed with exit code:", code);
      if (code === 0) {
        res.write(`\n✅ Docker build completed successfully!\n`);
        res.write(`🎉 Image '${imageName}' is ready to use.\n`);
        console.log("✅ Docker build successful");

        // If push to Docker Hub is requested and credentials are provided
        if (pushToDockerHub && dockerHubUsername && dockerHubPassword) {
          console.log("🐳 Attempting to push to Docker Hub");
          const pushSuccess = await pushToDockerHubFunction(
            imageName,
            dockerHubUsername,
            dockerHubPassword,
            res
          );

          if (pushSuccess) {
            res.write(
              `\n🎊 Complete! Image built and pushed to Docker Hub successfully!\n`
            );
            res.write(
              `🌐 Available at: https://hub.docker.com/r/${
                imageName.split(":")[0]
              }\n`
            );

            // In hosted mode, cleanup local image after successful push
            if (isHostedMode) {
              await cleanupLocalImage(imageName, res);
            }
          } else {
            res.write(
              `\n⚠️ Image built successfully but Docker Hub push failed.\n`
            );
          }
        } else if (isHostedMode) {
          // In hosted mode without push, this shouldn't happen due to earlier validation
          res.write(`\n⚠️ Warning: Hosted mode requires Docker Hub push\n`);
        }
      } else {
        res.write(`\n❌ Docker build failed with exit code: ${code}\n`);
        console.error("❌ Docker build failed with code:", code);
      }
      res.end();
    });

    // Handle errors
    dockerBuild.on("error", (error) => {
      console.error("💥 Docker build error:", error);
      res.write(`\n💥 Docker build error: ${error.message}\n`);
      if (error.message.includes("ENOENT")) {
        res.write(
          `\n📋 Make sure Docker is installed and running on your system.\n`
        );
        res.write(
          `📋 You can download Docker from: https://docker.com/get-started\n`
        );
      }
      res.end();
    });

    // Handle client disconnect
    req.on("close", () => {
      console.log("🔌 Client disconnected, killing Docker process");
      if (!dockerBuild.killed) {
        dockerBuild.kill();
      }
    });
  });

  dockerCheck.on("error", (error) => {
    console.error("💥 Docker version check error:", error);
    res.write(`💥 Error checking Docker: ${error.message}\n`);
    if (error.message.includes("ENOENT")) {
      res.write(`📋 Docker not found. Please install Docker first.\n`);
      res.write(`📋 Download from: https://docker.com/get-started\n`);
    }
    res.end();
  });
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};
