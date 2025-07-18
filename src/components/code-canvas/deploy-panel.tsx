"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { detectLanguage } from "@/lib/language-detection";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type FileItem } from "./file-explorer-panel";

interface DeployPanelProps {
  activeFile: FileItem | null;
  projectFiles: FileItem[];
  triggerDockerfileGeneration: number;
}

const cloudProviders = [
  { id: "aws", label: "AWS" },
  { id: "azure", label: "Azure" },
  { id: "gcp", label: "GCP" },
  { id: "other", label: "Other" },
];

const resourcesList = [
  { id: "vm", label: "VM (EC2, Droplet, etc.)" },
  { id: "loadBalancer", label: "Load Balancer" },
  { id: "managedDb", label: "Managed DB" },
  { id: "storageBucket", label: "Storage Bucket" },
];

const initialDockerfileContent = `# Multi-stage build for Next.js application
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install Python and build dependencies for node-gyp (only in deps stage)
RUN apk add --no-cache python3 make g++ gcc musl-dev libc6-compat

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ gcc musl-dev libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install all dependencies (including dev) for build
RUN npm ci

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user in final stage
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public

# Set permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy build output and set ownership
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use Next.js standalone server
CMD ["node", "server.js"]`;

const initialDeploymentYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app-container
        image: your-username/my-app:latest # Replace with your image
        ports:
        - containerPort: 80`;

const initialServiceYaml = `apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: LoadBalancer`;

const k8sClusters = [
  { id: "minikube", label: "Minikube (Local)" },
  { id: "gke-us-central1-a", label: "GKE (us-central1-a)" },
  { id: "eks-eu-west-1", label: "EKS (eu-west-1)" },
  { id: "custom-kubeconfig", label: "Custom Kubeconfig" },
];

type CollapsibleSectionName = "infrastructure" | "dockerize" | "kubernetes";

const DeployPanel: React.FC<DeployPanelProps> = ({
  activeFile,
  projectFiles,
  triggerDockerfileGeneration,
}) => {
  // Detect if running in hosted mode (production or explicitly set)
  const isHostedMode =
    typeof window !== "undefined" &&
    (process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_HOSTED_MODE === "true");
  const [selectedCloud, setSelectedCloud] = useState<string>("aws");
  const [selectedResources, setSelectedResources] = useState<
    Record<string, boolean>
  >({
    vm: true,
    loadBalancer: false,
    managedDb: false,
    storageBucket: false,
  });
  const [iacCode, setIacCode] = useState<string>(
    '// Click "Generate & Save" to see IaC output.'
  );
  const [dockerfileContent, setDockerfileContent] = useState<string>(
    initialDockerfileContent
  );

  const [dockerHubUsername, setDockerHubUsername] = useState<string>("");
  const [dockerHubPassword, setDockerHubPassword] = useState<string>("");
  const [imageName, setImageName] = useState<string>(
    "your-username/my-app:latest"
  );

  // Auto-update image name when username changes
  useEffect(() => {
    if (dockerHubUsername.trim()) {
      // Extract username part if it's an email address, otherwise use as-is
      let username = dockerHubUsername.trim();
      if (username.includes("@")) {
        username = username.split("@")[0];
      }
      // Remove any special characters that aren't allowed in Docker image names
      username = username.replace(/[^a-zA-Z0-9._-]/g, "");
      setImageName(`${username}/my-app:latest`);
    } else {
      setImageName("your-username/my-app:latest");
    }
  }, [dockerHubUsername]);

  const [selectedK8sCluster, setSelectedK8sCluster] =
    useState<string>("minikube");
  const [deploymentYaml, setDeploymentYaml] = useState<string>(
    initialDeploymentYaml
  );
  const [serviceYaml, setServiceYaml] = useState<string>(initialServiceYaml);
  const [activeK8sYamlView, setActiveK8sYamlView] = useState<
    "deployment" | "service" | null
  >(null);
  const [currentK8sYaml, setCurrentK8sYaml] = useState<string>(
    "// Select a YAML file type to view/edit."
  );

  // AWS Credentials
  const [awsAccessKey, setAwsAccessKey] = useState<string>("");
  const [awsSecretKey, setAwsSecretKey] = useState<string>("");
  const [awsRegion, setAwsRegion] = useState<string>("");

  // Azure Credentials
  const [azureClientId, setAzureClientId] = useState<string>("");
  const [azureClientSecret, setAzureClientSecret] = useState<string>("");
  const [azureTenantId, setAzureTenantId] = useState<string>("");

  // Terminal states for build logs
  const [buildOutput, setBuildOutput] = useState<string>("");
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [showBuildOutput, setShowBuildOutput] = useState<boolean>(false);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [azureSubscriptionId, setAzureSubscriptionId] = useState<string>("");

  // GCP Credentials
  const [gcpProjectId, setGcpProjectId] = useState<string>("");
  const [gcpJsonKey, setGcpJsonKey] = useState<string>("");
  const [isGeneratingDockerfile, setIsGeneratingDockerfile] = useState(false);

  const [openSections, setOpenSections] = useState<
    Record<CollapsibleSectionName, boolean>
  >({
    infrastructure: true,
    dockerize: false,
    kubernetes: false,
  });

  const toggleSection = (sectionName: CollapsibleSectionName) => {
    setOpenSections((prev) => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

  const handleResourceChange = (resourceId: string) => {
    setSelectedResources((prev) => ({
      ...prev,
      [resourceId]: !prev[resourceId],
    }));
  };

  const handleGenerateIac = () => {
    setIacCode(
      `
# Terraform code for ${selectedCloud.toUpperCase()}
# Selected resources:
${Object.entries(selectedResources)
  .filter(([, checked]) => checked)
  .map(
    ([key]) => `# - ${resourcesList.find((r) => r.id === key)?.label || key}`
  )
  .join("\n")}

provider "${selectedCloud === "other" ? "custom_provider" : selectedCloud}" {
  # TODO: Add ${selectedCloud.toUpperCase()} provider configuration
  # region = "us-west-2" # Example
}

${
  selectedResources.vm
    ? `
resource "aws_instance" "example_vm" { # Placeholder, adjust for actual provider
  ami           = "ami-0abcdef1234567890" # Example AMI
  instance_type = "t2.micro"
  tags = {
    Name = "MyVM"
  }
}
`
    : ""
}
${
  selectedResources.loadBalancer
    ? `
# resource "aws_lb" "example_lb" { ... } # Placeholder
`
    : ""
}
${
  selectedResources.managedDb
    ? `
# resource "aws_db_instance" "example_db" { ... } # Placeholder
`
    : ""
}
${
  selectedResources.storageBucket
    ? `
# resource "aws_s3_bucket" "example_bucket" { ... } # Placeholder
`
    : ""
}
    `.trim()
    );
    // Log simulation removed
    console.log("Generated and saved IaC to main.tf (simulated).");
  };

  const handleGenerateDockerfile = async () => {
    if (!activeFile) {
      // TODO: Show a toast or other user-facing error
      console.error("Cannot generate Dockerfile: no file is active.");
      return;
    }
    setIsGeneratingDockerfile(true);
    try {
      const language = detectLanguage(activeFile.path);
      console.log(
        `Requesting Dockerfile for ${activeFile.path} (lang: ${language})`
      );

      const response = await fetch("/api/generate-dockerfile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileContents: activeFile.content,
          language: language,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API Error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();
      if (data.dockerfile) {
        setDockerfileContent(data.dockerfile);
        console.log("Generated Dockerfile content:", data.dockerfile);
      }
    } catch (error) {
      console.error("Failed to generate Dockerfile:", error);
      // Optionally, show an error to the user in the UI
    } finally {
      setIsGeneratingDockerfile(false);
    }
  };

  useEffect(() => {
    if (triggerDockerfileGeneration > 0) {
      handleGenerateDockerfile();
    }
  }, [triggerDockerfileGeneration]);

  const handleProvisionInfrastructure = () => {
    // Log simulation removed
    console.log(
      `Starting infrastructure provisioning for ${selectedCloud.toUpperCase()}...`
    );
    console.log(`Using IaC:\n${iacCode}\n`);
    // Simulate provisioning steps
    console.log("Authenticating with cloud provider...");
    console.log("Provider authenticated.");
    // ... other simulated steps
    console.log("Infrastructure provisioning complete.");
  };

  const handleBuildDockerImage = async () => {
    console.log("🔧 Starting Docker build from frontend");

    // In hosted mode, Docker Hub credentials are mandatory
    if (isHostedMode && (!dockerHubUsername || !dockerHubPassword)) {
      setBuildOutput(
        "❌ Docker Hub credentials are required for hosted applications\n"
      );
      setBuildOutput(
        (prev) =>
          prev +
          "💡 Built images must be pushed to Docker Hub as they cannot be stored locally on the server\n"
      );
      setBuildOutput(
        (prev) =>
          prev + "🔐 Please provide your Docker Hub username and access token\n"
      );
      setShowBuildOutput(true);
      return;
    }

    setIsBuilding(true);
    setShowBuildOutput(true);
    setBuildOutput("🔧 Initializing Docker build...\n");

    // Always push to Docker Hub in hosted mode, optional in local mode
    const shouldPushToDockerHub =
      isHostedMode || !!(dockerHubUsername && dockerHubPassword);

    if (shouldPushToDockerHub) {
      setBuildOutput(
        (prev) =>
          prev +
          (isHostedMode
            ? "🐳 Hosted mode: Will build and push to Docker Hub\n"
            : "🐳 Docker Hub credentials provided - will push after build\n")
      );
    }

    try {
      console.log("📡 Making fetch request to /api/docker-build");
      console.log("📦 Payload:", {
        imageName,
        dockerfileContent,
        pushToDockerHub: shouldPushToDockerHub,
        dockerHubUsername: shouldPushToDockerHub
          ? dockerHubUsername
          : undefined,
        dockerHubPassword: shouldPushToDockerHub
          ? dockerHubPassword
          : undefined,
        isHostedMode,
      });

      const response = await fetch("/api/docker-build", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageName: imageName,
          dockerfileContent: dockerfileContent,
          pushToDockerHub: shouldPushToDockerHub,
          dockerHubUsername: shouldPushToDockerHub
            ? dockerHubUsername
            : undefined,
          dockerHubPassword: shouldPushToDockerHub
            ? dockerHubPassword
            : undefined,
          isHostedMode,
        }),
      });

      console.log(
        "📡 Response received:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        throw new Error(
          `Build failed: ${response.status} ${response.statusText}`
        );
      }

      if (!response.body) {
        throw new Error("No response body received");
      }

      setBuildOutput((prev) => prev + "📡 Connected to build server...\n");
      console.log("📡 Starting to read response stream");

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let chunkCount = 0;
      while (true) {
        console.log(`📦 Reading chunk ${chunkCount + 1}`);
        const { done, value } = await reader.read();

        if (done) {
          console.log("✅ Stream reading completed");
          break;
        }

        const chunk = decoder.decode(value);
        console.log("📦 Received chunk:", chunk.length, "characters");
        console.log(
          "📝 Chunk content:",
          chunk.substring(0, 100) + (chunk.length > 100 ? "..." : "")
        );

        setBuildOutput((prev) => prev + chunk);
        chunkCount++;
      }
    } catch (error) {
      console.error("❌ Docker build error:", error);
      setBuildOutput((prev) => prev + `\n❌ Error: ${error}\n`);
    } finally {
      console.log("🏁 Docker build process finished");
      setIsBuilding(false);
    }
  };

  const handlePushImage = async () => {
    if (!dockerHubUsername || !dockerHubPassword || !imageName) {
      setBuildOutput(
        (prev) => prev + "❌ Missing Docker Hub credentials or image name\n"
      );
      setShowBuildOutput(true);
      return;
    }

    console.log(`🐳 Starting Docker image push for ${imageName}...`);
    setIsPushing(true);
    setShowBuildOutput(true);
    setBuildOutput(
      (prev) => prev + `🐳 Starting push of ${imageName} to Docker Hub...\n`
    );

    try {
      const response = await fetch("/api/docker-build", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageName: imageName,
          dockerfileContent: "", // No build needed, just push
          pushToDockerHub: true,
          dockerHubUsername: dockerHubUsername,
          dockerHubPassword: dockerHubPassword,
          skipBuild: true, // Add flag to skip build and just push
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Push failed: ${response.status} ${response.statusText}`
        );
      }

      if (!response.body) {
        throw new Error("No response body received");
      }

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log("✅ Push stream reading completed");
          break;
        }

        const chunk = decoder.decode(value);
        setBuildOutput((prev) => prev + chunk);
      }
    } catch (error) {
      console.error("❌ Docker push error:", error);
      setBuildOutput((prev) => prev + `\n❌ Push Error: ${error}\n`);
    } finally {
      setIsPushing(false);
    }
  };

  const handleSelectK8sYaml = (type: "deployment" | "service") => {
    setActiveK8sYamlView(type);
    if (type === "deployment") {
      setCurrentK8sYaml(deploymentYaml);
    } else if (type === "service") {
      setCurrentK8sYaml(serviceYaml);
    }
  };

  const handleK8sYamlChange = (content: string) => {
    setCurrentK8sYaml(content);
    if (activeK8sYamlView === "deployment") {
      setDeploymentYaml(content);
    } else if (activeK8sYamlView === "service") {
      setServiceYaml(content);
    }
  };

  const handleApplyKubernetesConfig = () => {
    // Log simulation removed
    console.log(`Starting Kubernetes deployment to ${selectedK8sCluster}...`);
    console.log(
      `Deployment YAML:\n${deploymentYaml}\n\nService YAML:\n${serviceYaml}\n`
    );
    // Simulate deployment steps
    console.log(`Connecting to cluster: ${selectedK8sCluster}...`);
    console.log("Kubernetes deployment successful.");
  };

  useEffect(() => {
    if (!activeFile) {
      setActiveK8sYamlView(null);
      setCurrentK8sYaml("// Select a YAML file type to view/edit.");
    }
  }, [activeFile]);

  return (
    <ScrollArea className="h-full w-full bg-card p-4 overflow-hidden panel-content">
      <div className="flex flex-col space-y-4 min-w-0 max-w-full">
        <Card className="shadow-none border-border/50 min-w-0">
          <CardHeader
            className="p-3 flex flex-row items-center justify-between cursor-pointer"
            onClick={() => toggleSection("infrastructure")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") &&
              toggleSection("infrastructure")
            }
            aria-expanded={openSections.infrastructure}
            aria-controls="infrastructure-content"
          >
            <CardTitle className="text-sm font-medium">
              Infrastructure
            </CardTitle>
            {openSections.infrastructure ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CardHeader>
          {openSections.infrastructure && (
            <CardContent
              className="space-y-3 p-3 pt-0"
              id="infrastructure-content"
            >
              <div>
                <Label className="text-xs font-medium mb-1.5 block text-muted-foreground">
                  Select Cloud Provider
                </Label>
                <RadioGroup
                  value={selectedCloud}
                  onValueChange={setSelectedCloud}
                  className="flex flex-wrap gap-x-3 gap-y-1.5"
                >
                  {cloudProviders.map((provider) => (
                    <div
                      key={provider.id}
                      className="flex items-center space-x-1.5"
                    >
                      <RadioGroupItem
                        value={provider.id}
                        id={`cloud-${provider.id}`}
                        className="w-3.5 h-3.5"
                      />
                      <Label
                        htmlFor={`cloud-${provider.id}`}
                        className="text-xs font-normal cursor-pointer"
                      >
                        {provider.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {selectedCloud === "aws" && (
                <div className="space-y-2 pt-2 border-t border-border/30 mt-3">
                  <Label className="text-xs font-semibold text-foreground">
                    AWS Credentials
                  </Label>
                  <div>
                    <Label
                      htmlFor="awsAccessKey"
                      className="text-xs font-medium mb-1 block text-muted-foreground"
                    >
                      Access Key ID
                    </Label>
                    <Input
                      id="awsAccessKey"
                      value={awsAccessKey}
                      onChange={(e) => setAwsAccessKey(e.target.value)}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      className="text-xs h-8 min-w-0 w-full"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="awsSecretKey"
                      className="text-xs font-medium mb-1 block text-muted-foreground"
                    >
                      Secret Access Key
                    </Label>
                    <Input
                      id="awsSecretKey"
                      type="password"
                      value={awsSecretKey}
                      onChange={(e) => setAwsSecretKey(e.target.value)}
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      className="text-xs h-8 min-w-0 w-full"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="awsRegion"
                      className="text-xs font-medium mb-1 block text-muted-foreground"
                    >
                      Default Region
                    </Label>
                    <Input
                      id="awsRegion"
                      value={awsRegion}
                      onChange={(e) => setAwsRegion(e.target.value)}
                      placeholder="us-east-1"
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              )}

              {selectedCloud === "azure" && (
                <div className="space-y-2 pt-2 border-t border-border/30 mt-3">
                  <Label className="text-xs font-semibold text-foreground">
                    Azure Credentials
                  </Label>
                  <div>
                    <Label
                      htmlFor="azureClientId"
                      className="text-xs font-medium mb-1 block text-muted-foreground"
                    >
                      Client ID
                    </Label>
                    <Input
                      id="azureClientId"
                      value={azureClientId}
                      onChange={(e) => setAzureClientId(e.target.value)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="azureClientSecret"
                      className="text-xs font-medium mb-1 block text-muted-foreground"
                    >
                      Client Secret
                    </Label>
                    <Input
                      id="azureClientSecret"
                      type="password"
                      value={azureClientSecret}
                      onChange={(e) => setAzureClientSecret(e.target.value)}
                      placeholder="Enter Client Secret"
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="azureTenantId"
                      className="text-xs font-medium mb-1 block text-muted-foreground"
                    >
                      Tenant ID
                    </Label>
                    <Input
                      id="azureTenantId"
                      value={azureTenantId}
                      onChange={(e) => setAzureTenantId(e.target.value)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="azureSubscriptionId"
                      className="text-xs font-medium mb-1 block text-muted-foreground"
                    >
                      Subscription ID
                    </Label>
                    <Input
                      id="azureSubscriptionId"
                      value={azureSubscriptionId}
                      onChange={(e) => setAzureSubscriptionId(e.target.value)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              )}

              {selectedCloud === "gcp" && (
                <div className="space-y-2 pt-2 border-t border-border/30 mt-3">
                  <Label className="text-xs font-semibold text-foreground">
                    GCP Credentials
                  </Label>
                  <div>
                    <Label
                      htmlFor="gcpProjectId"
                      className="text-xs font-medium mb-1 block text-muted-foreground"
                    >
                      Project ID
                    </Label>
                    <Input
                      id="gcpProjectId"
                      value={gcpProjectId}
                      onChange={(e) => setGcpProjectId(e.target.value)}
                      placeholder="your-gcp-project-id"
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="gcpJsonKey"
                      className="text-xs font-medium mb-1 block text-muted-foreground"
                    >
                      JSON Key Content (Service Account)
                    </Label>
                    <Textarea
                      id="gcpJsonKey"
                      value={gcpJsonKey}
                      onChange={(e) => setGcpJsonKey(e.target.value)}
                      placeholder='{ "type": "service_account", ... }'
                      className="text-xs h-24 bg-background/30 border-border/70 font-code leading-relaxed"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-border/30 mt-3">
                <Label className="text-xs font-medium mb-1.5 block text-muted-foreground">
                  Resources
                </Label>
                <div className="space-y-1.5">
                  {resourcesList.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`resource-${resource.id}`}
                        checked={!!selectedResources[resource.id]}
                        onCheckedChange={() =>
                          handleResourceChange(resource.id)
                        }
                        className="w-3.5 h-3.5"
                      />
                      <Label
                        htmlFor={`resource-${resource.id}`}
                        className="text-xs font-normal cursor-pointer"
                      >
                        {resource.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <Textarea
                readOnly
                value={iacCode}
                className="h-36 text-xs bg-background/30 border-border/70 font-code leading-relaxed"
                rows={8}
                aria-label="Infrastructure as Code Output"
              />
              <div className="flex flex-col space-y-1.5">
                <Button
                  onClick={handleGenerateIac}
                  size="sm"
                  className="text-xs h-7"
                >
                  Generate & Save as main.tf
                </Button>
                <Button
                  onClick={handleProvisionInfrastructure}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                >
                  Provision Infrastructure
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        <Card className="shadow-none border-border/50">
          <CardHeader
            className="p-3 flex flex-row items-center justify-between cursor-pointer"
            onClick={() => toggleSection("dockerize")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && toggleSection("dockerize")
            }
            aria-expanded={openSections.dockerize}
            aria-controls="dockerize-content"
          >
            <CardTitle className="text-sm font-medium">Dockerize</CardTitle>
            {openSections.dockerize ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CardHeader>
          {openSections.dockerize && (
            <CardContent className="space-y-3 p-3 pt-0" id="dockerize-content">
              <Label className="text-xs font-medium mb-1.5 block text-muted-foreground">
                Dockerfile
              </Label>
              <Textarea
                value={dockerfileContent}
                onChange={(e) => setDockerfileContent(e.target.value)}
                className="h-48 text-xs bg-background/30 border-border/70 font-code leading-relaxed"
                rows={10}
                aria-label="Editable Dockerfile"
              />

              {/* Generate Dockerfile Button - positioned right after textarea */}
              <div className="pt-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleGenerateDockerfile}
                        size="sm"
                        className={cn(
                          "text-xs h-7",
                          isGeneratingDockerfile &&
                            "bg-secondary text-secondary-foreground cursor-not-allowed hover:bg-secondary/80"
                        )}
                        disabled={isGeneratingDockerfile || !activeFile}
                      >
                        {isGeneratingDockerfile ? (
                          <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />{" "}
                            Generating...
                          </>
                        ) : (
                          "Generate Dockerfile"
                        )}
                      </Button>
                    </TooltipTrigger>
                    {!activeFile && (
                      <TooltipContent>
                        <p>Open a file to generate a Dockerfile.</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Docker Hub Credentials Section */}
              <div className="pt-3 border-t border-border/30 space-y-3">
                <Label className="text-xs font-semibold text-foreground">
                  Docker Hub Registry{" "}
                  {isHostedMode && <span className="text-red-500">*</span>}
                </Label>

                {isHostedMode && (
                  <div className="text-xs text-amber-600 dark:text-amber-400 p-2 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800">
                    ⚠️ <strong>Hosted Mode:</strong> Docker Hub credentials are
                    required. Built images must be pushed to Docker Hub as they
                    cannot be stored locally on the server.
                  </div>
                )}

                <div>
                  <Label
                    htmlFor="dockerHubUser"
                    className="text-xs font-medium mb-1.5 block text-muted-foreground"
                  >
                    Docker Hub Username{" "}
                    {isHostedMode && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="dockerHubUser"
                    value={dockerHubUsername}
                    onChange={(e) => setDockerHubUsername(e.target.value)}
                    placeholder="e.g., yourusername"
                    className="text-xs h-8"
                    required={isHostedMode}
                  />
                </div>

                <div>
                  <Label
                    htmlFor="dockerHubPass"
                    className="text-xs font-medium mb-1.5 block text-muted-foreground"
                  >
                    Docker Hub Access Token{" "}
                    {isHostedMode && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="dockerHubPass"
                    type="password"
                    value={dockerHubPassword}
                    onChange={(e) => setDockerHubPassword(e.target.value)}
                    placeholder="Enter your access token (preferred) or password"
                    className="text-xs h-8"
                    required={isHostedMode}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    🔐 Use Docker Hub Access Tokens for better security.
                    <a
                      href="https://docs.docker.com/docker-hub/access-tokens/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 underline ml-1"
                    >
                      Learn how to create one
                    </a>
                  </p>
                </div>

                <div>
                  <Label
                    htmlFor="imageName"
                    className="text-xs font-medium mb-1.5 block text-muted-foreground"
                  >
                    Image Name (Auto-updated from username)
                  </Label>
                  <Input
                    id="imageName"
                    value={imageName}
                    onChange={(e) => setImageName(e.target.value)}
                    placeholder="e.g., your-username/my-app:latest"
                    className="text-xs h-8"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Image name automatically updates from your username
                    (emails will use the part before @)
                  </p>
                </div>
              </div>

              {/* Additional tips for hosted mode */}
              {isHostedMode && (
                <div className="text-xs text-blue-600 dark:text-blue-400 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                  <strong>Hosted Mode Behavior:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>
                      • Docker images are built and immediately pushed to Docker
                      Hub
                    </li>
                    <li>
                      • Local storage is not available - remote registry is
                      mandatory
                    </li>
                    <li>
                      • Images are automatically cleaned up after successful
                      push
                    </li>
                  </ul>
                </div>
              )}

              <div className="flex flex-col space-y-1.5">
                <Button
                  onClick={handleBuildDockerImage}
                  size="sm"
                  className="text-xs h-7"
                  disabled={
                    isBuilding ||
                    (isHostedMode && (!dockerHubUsername || !dockerHubPassword))
                  }
                >
                  {isBuilding ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      {isHostedMode || (dockerHubUsername && dockerHubPassword)
                        ? "Building & Pushing to Docker Hub..."
                        : "Building Docker Image..."}
                    </>
                  ) : isHostedMode ? (
                    "Build & Push to Docker Hub"
                  ) : dockerHubUsername && dockerHubPassword ? (
                    "Build & Push to Docker Hub"
                  ) : (
                    "Build Docker Image"
                  )}
                </Button>
              </div>

              {/* Docker Build Output */}
              {showBuildOutput && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Docker Build Output
                    </Label>
                    <Button
                      onClick={() => setShowBuildOutput(false)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </Button>
                  </div>
                  <div className="bg-black border border-border/50 rounded-md">
                    <ScrollArea className="h-64 w-full">
                      <pre className="p-3 text-xs font-mono text-green-400 whitespace-pre-wrap leading-relaxed">
                        {buildOutput}
                        {isBuilding && (
                          <span className="animate-pulse text-blue-400">
                            ▊ Building...
                          </span>
                        )}
                      </pre>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        <Card className="shadow-none border-border/50">
          <CardHeader
            className="p-3 flex flex-row items-center justify-between cursor-pointer"
            onClick={() => toggleSection("kubernetes")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") &&
              toggleSection("kubernetes")
            }
            aria-expanded={openSections.kubernetes}
            aria-controls="kubernetes-content"
          >
            <CardTitle className="text-sm font-medium">Kubernetes</CardTitle>
            {openSections.kubernetes ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CardHeader>
          {openSections.kubernetes && (
            <CardContent className="space-y-3 p-3 pt-0" id="kubernetes-content">
              <div>
                <Label
                  htmlFor="k8sCluster"
                  className="text-xs font-medium mb-1.5 block text-muted-foreground"
                >
                  Select Cluster
                </Label>
                <Select
                  value={selectedK8sCluster}
                  onValueChange={setSelectedK8sCluster}
                >
                  <SelectTrigger id="k8sCluster" className="text-xs h-8">
                    <SelectValue placeholder="Select a K8s cluster" />
                  </SelectTrigger>
                  <SelectContent>
                    {k8sClusters.map((cluster) => (
                      <SelectItem
                        key={cluster.id}
                        value={cluster.id}
                        className="text-xs"
                      >
                        {cluster.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={
                    activeK8sYamlView === "deployment" ? "default" : "outline"
                  }
                  size="sm"
                  className="text-xs h-7 flex-1"
                  onClick={() => handleSelectK8sYaml("deployment")}
                >
                  Deployment.yaml
                </Button>
                <Button
                  variant={
                    activeK8sYamlView === "service" ? "default" : "outline"
                  }
                  size="sm"
                  className="text-xs h-7 flex-1"
                  onClick={() => handleSelectK8sYaml("service")}
                >
                  Service.yaml
                </Button>
              </div>
              <Textarea
                value={currentK8sYaml}
                onChange={(e) => handleK8sYamlChange(e.target.value)}
                className="h-48 text-xs bg-background/30 border-border/70 font-code leading-relaxed"
                rows={10}
                aria-label="Editable Kubernetes YAML"
                disabled={!activeK8sYamlView}
              />
              <Button
                onClick={handleApplyKubernetesConfig}
                size="sm"
                className="w-full text-xs h-7"
              >
                Apply Kubernetes Configuration
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </ScrollArea>
  );
};

export default DeployPanel;
