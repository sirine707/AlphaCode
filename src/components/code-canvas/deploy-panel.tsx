
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DeployPanelProps {
  isOpen: boolean;
}

const cloudProviders = [
  { id: 'aws', label: 'AWS' },
  { id: 'azure', label: 'Azure' },
  { id: 'gcp', label: 'GCP' },
  { id: 'other', label: 'Other' },
];

const resourcesList = [
  { id: 'vm', label: 'VM (EC2, Droplet, etc.)' },
  { id: 'loadBalancer', label: 'Load Balancer' },
  { id: 'managedDb', label: 'Managed DB' },
  { id: 'storageBucket', label: 'Storage Bucket' },
];

const initialDockerfileContent = `FROM python:3.10-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["python", "app.py"]`;

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
    { id: 'minikube', label: 'Minikube (Local)' },
    { id: 'gke-us-central1-a', label: 'GKE (us-central1-a)' },
    { id: 'eks-eu-west-1', label: 'EKS (eu-west-1)' },
    { id: 'custom-kubeconfig', label: 'Custom Kubeconfig' },
];

const DeployPanel: React.FC<DeployPanelProps> = ({ isOpen }) => {
  const [selectedCloud, setSelectedCloud] = useState<string>('aws');
  const [selectedResources, setSelectedResources] = useState<Record<string, boolean>>({
    vm: true,
    loadBalancer: false,
    managedDb: false,
    storageBucket: false,
  });
  const [iacCode, setIacCode] = useState<string>('// Click "Generate & Save" to see IaC output.');
  const [dockerfileContent, setDockerfileContent] = useState<string>(initialDockerfileContent);
  const [logs, setLogs] = useState<string>('');
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);

  const [dockerHubUsername, setDockerHubUsername] = useState<string>('');
  const [dockerHubPassword, setDockerHubPassword] = useState<string>('');
  const [imageName, setImageName] = useState<string>('your-username/my-app:latest');

  const [selectedK8sCluster, setSelectedK8sCluster] = useState<string>('minikube');
  const [deploymentYaml, setDeploymentYaml] = useState<string>(initialDeploymentYaml);
  const [serviceYaml, setServiceYaml] = useState<string>(initialServiceYaml);
  const [activeK8sYamlView, setActiveK8sYamlView] = useState<'deployment' | 'service' | null>(null);
  const [currentK8sYaml, setCurrentK8sYaml] = useState<string>('// Select a YAML file type to view/edit.');

  // AWS Credentials
  const [awsAccessKey, setAwsAccessKey] = useState<string>('');
  const [awsSecretKey, setAwsSecretKey] = useState<string>('');
  const [awsRegion, setAwsRegion] = useState<string>('');

  // Azure Credentials
  const [azureClientId, setAzureClientId] = useState<string>('');
  const [azureClientSecret, setAzureClientSecret] = useState<string>('');
  const [azureTenantId, setAzureTenantId] = useState<string>('');
  const [azureSubscriptionId, setAzureSubscriptionId] = useState<string>('');

  // GCP Credentials
  const [gcpProjectId, setGcpProjectId] = useState<string>('');
  const [gcpJsonKey, setGcpJsonKey] = useState<string>('');


  const handleResourceChange = (resourceId: string) => {
    setSelectedResources((prev) => ({ ...prev, [resourceId]: !prev[resourceId] }));
  };

  const handleGenerateIac = () => {
    setIacCode(`
# Terraform code for ${selectedCloud.toUpperCase()}
# Selected resources:
${Object.entries(selectedResources)
  .filter(([, checked]) => checked)
  .map(([key]) => `# - ${resourcesList.find(r => r.id === key)?.label || key}`)
  .join('\n')}

provider "${selectedCloud === 'other' ? 'custom_provider' : selectedCloud}" {
  # TODO: Add ${selectedCloud.toUpperCase()} provider configuration
  # region = "us-west-2" # Example
}

${selectedResources.vm ? `
resource "aws_instance" "example_vm" { # Placeholder, adjust for actual provider
  ami           = "ami-0abcdef1234567890" # Example AMI
  instance_type = "t2.micro"
  tags = {
    Name = "MyVM"
  }
}
` : ''}
${selectedResources.loadBalancer ? `
# resource "aws_lb" "example_lb" { ... } # Placeholder
` : ''}
${selectedResources.managedDb ? `
# resource "aws_db_instance" "example_db" { ... } # Placeholder
` : ''}
${selectedResources.storageBucket ? `
# resource "aws_s3_bucket" "example_bucket" { ... } # Placeholder
` : ''}
    `.trim());
    setLogs('Generated and saved IaC to main.tf (simulated).\n');
    setShowLogs(true);
    setCurrentOperation('IaC Generation');
  };

  const handleProvisionInfrastructure = () => {
    setCurrentOperation('Infrastructure Provisioning');
    setLogs(`Starting infrastructure provisioning for ${selectedCloud.toUpperCase()}...\n`);
    setShowLogs(true);
    let currentLogs = `Starting infrastructure provisioning for ${selectedCloud.toUpperCase()}...\n`;
    currentLogs += `Using IaC:\n${iacCode}\n\n`;
    
    const logQueue = [
      'Authenticating with cloud provider...',
      'Provider authenticated.',
      'Initializing Terraform...',
      'Terraform initialized.',
      'Planning changes...',
      'Plan successful. Applying changes...',
      ...(selectedResources.vm ? ['Provisioning VM...','VM provisioned.'] : []),
      ...(selectedResources.loadBalancer ? ['Provisioning Load Balancer...','Load Balancer provisioned.'] : []),
      ...(selectedResources.managedDb ? ['Provisioning Managed DB...','Managed DB provisioned.'] : []),
      ...(selectedResources.storageBucket ? ['Provisioning Storage Bucket...','Storage Bucket provisioned.'] : []),
      'Applying final configurations...',
      'Infrastructure provisioning complete.'
    ];

    let logIndex = 0;
    const intervalId = setInterval(() => {
      if (logIndex < logQueue.length) {
        currentLogs += `${logQueue[logIndex]}\n`;
        setLogs(currentLogs);
        logIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 700);
  };

  const handleBuildDockerImage = () => {
    setCurrentOperation('Docker Image Build');
    setLogs(`Starting Docker image build...\n`);
    setShowLogs(true);
    let currentLogs = `Starting Docker image build...\n`;
    currentLogs += `Using Dockerfile:\n${dockerfileContent}\n\n`;

    const logQueue = [
      'Connecting to Docker daemon...',
      'Connected to Docker daemon.',
      'Sending build context to Docker daemon...',
      'Step 1/5 : FROM python:3.10-slim',
      ' ---> Using cache',
      ' ---> abcdef123456',
      'Step 2/5 : WORKDIR /app',
      ' ---> Using cache',
      ' ---> 123456abcdef',
      'Step 3/5 : COPY . .',
      ' ---> Using cache',
      ' ---> fedcba654321',
      'Step 4/5 : RUN pip install -r requirements.txt',
      ' ---> Running in deadbeef1234',
      'Collecting ... (simulated)',
      'Successfully installed ...',
      'Removing intermediate container deadbeef1234',
      ' ---> 001122334455',
      'Step 5/5 : CMD ["python", "app.py"]',
      ' ---> Running in 554433221100',
      'Removing intermediate container 554433221100',
      ' ---> aabbccddeeff',
      'Successfully built aabbccddeeff',
      `Successfully tagged ${imageName || 'my-app:latest'}`,
      'Docker image build complete.',
    ];

    let logIndex = 0;
    const intervalId = setInterval(() => {
      if (logIndex < logQueue.length) {
        currentLogs += `${logQueue[logIndex]}\n`;
        setLogs(currentLogs);
        logIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 500);
  };

  const handlePushImage = () => {
    setCurrentOperation('Docker Image Push');
    setLogs(`Starting Docker image push for ${imageName}...\n`);
    setShowLogs(true);
    let currentLogs = `Starting Docker image push for ${imageName}...\n`;
    currentLogs += `Username: ${dockerHubUsername}\n`;

    const logQueue = [
      `Authenticating with Docker Hub as ${dockerHubUsername}...`,
      'Login Succeeded.',
      `Pushing image ${imageName}...`,
      'The push refers to repository [docker.io/your-username/my-app]',
      'layer1: Pushed',
      'layer2: Pushed',
      'layer3: Pushed',
      'layer4: Pushing [===>                                               ]  5.5MB/100MB',
      'layer4: Pushing [=========>                                         ] 15.5MB/100MB',
      'layer4: Pushed',
      'latest: digest: sha256:abcdef1234567890abcdef1234567890 size: 1234',
      'Image push complete.',
    ];

    let logIndex = 0;
    const intervalId = setInterval(() => {
      if (logIndex < logQueue.length) {
        currentLogs += `${logQueue[logIndex]}\n`;
        setLogs(currentLogs);
        logIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 600);
  };

  const handleSelectK8sYaml = (type: 'deployment' | 'service') => {
    setActiveK8sYamlView(type);
    if (type === 'deployment') {
      setCurrentK8sYaml(deploymentYaml);
    } else if (type === 'service') {
      setCurrentK8sYaml(serviceYaml);
    }
  };

  const handleK8sYamlChange = (content: string) => {
    setCurrentK8sYaml(content);
    if (activeK8sYamlView === 'deployment') {
      setDeploymentYaml(content);
    } else if (activeK8sYamlView === 'service') {
      setServiceYaml(content);
    }
  };
  
  const handleApplyKubernetesConfig = () => {
    setCurrentOperation('Kubernetes Deployment');
    setLogs(`Starting Kubernetes deployment to ${selectedK8sCluster}...\n`);
    setShowLogs(true);
    let currentLogs = `Starting Kubernetes deployment to ${selectedK8sCluster}...\n`;
    currentLogs += `Deployment YAML:\n${deploymentYaml}\n\nService YAML:\n${serviceYaml}\n\n`;

    const logQueue = [
      `Connecting to cluster: ${selectedK8sCluster}...`,
      'Successfully connected to cluster.',
      'Applying deployment.yaml...',
      'deployment.apps/my-app-deployment created (simulated)',
      'Applying service.yaml...',
      'service/my-app-service created (simulated)',
      'Waiting for resources to be ready...',
      'All resources ready.',
      'Kubernetes deployment successful.'
    ];
    
    let logIndex = 0;
    const intervalId = setInterval(() => {
      if (logIndex < logQueue.length) {
        currentLogs += `${logQueue[logIndex]}\n`;
        setLogs(currentLogs);
        logIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 600);
  };
  
  useEffect(() => {
    if (!isOpen) {
      setShowLogs(false);
      setActiveK8sYamlView(null);
      setCurrentK8sYaml('// Select a YAML file type to view/edit.');
    }
  }, [isOpen]);

  return (
    <div
      className={cn(
        "h-full bg-card shadow-md transition-all duration-300 ease-in-out overflow-hidden border-r border-border",
        isOpen ? "w-[450px] p-3" : "w-0 p-0" 
      )}
    >
      {isOpen && (
        <ScrollArea className="h-full">
          <div className="flex flex-col space-y-4">
            <Card className="shadow-none border-border/50">
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">Infrastructure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-3">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block text-muted-foreground">Select Cloud Provider</Label>
                  <RadioGroup value={selectedCloud} onValueChange={setSelectedCloud} className="flex flex-wrap gap-x-3 gap-y-1.5">
                    {cloudProviders.map((provider) => (
                      <div key={provider.id} className="flex items-center space-x-1.5">
                        <RadioGroupItem value={provider.id} id={`cloud-${provider.id}`} className="w-3.5 h-3.5"/>
                        <Label htmlFor={`cloud-${provider.id}`} className="text-xs font-normal cursor-pointer">{provider.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {selectedCloud === 'aws' && (
                  <div className="space-y-2 pt-2 border-t border-border/30 mt-3">
                    <Label className="text-xs font-semibold text-foreground">AWS Credentials</Label>
                    <div>
                      <Label htmlFor="awsAccessKey" className="text-xs font-medium mb-1 block text-muted-foreground">Access Key ID</Label>
                      <Input id="awsAccessKey" value={awsAccessKey} onChange={(e) => setAwsAccessKey(e.target.value)} placeholder="AKIAIOSFODNN7EXAMPLE" className="text-xs h-8"/>
                    </div>
                    <div>
                      <Label htmlFor="awsSecretKey" className="text-xs font-medium mb-1 block text-muted-foreground">Secret Access Key</Label>
                      <Input id="awsSecretKey" type="password" value={awsSecretKey} onChange={(e) => setAwsSecretKey(e.target.value)} placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" className="text-xs h-8"/>
                    </div>
                    <div>
                      <Label htmlFor="awsRegion" className="text-xs font-medium mb-1 block text-muted-foreground">Default Region</Label>
                      <Input id="awsRegion" value={awsRegion} onChange={(e) => setAwsRegion(e.target.value)} placeholder="us-east-1" className="text-xs h-8"/>
                    </div>
                  </div>
                )}

                {selectedCloud === 'azure' && (
                  <div className="space-y-2 pt-2 border-t border-border/30 mt-3">
                    <Label className="text-xs font-semibold text-foreground">Azure Credentials</Label>
                    <div>
                      <Label htmlFor="azureClientId" className="text-xs font-medium mb-1 block text-muted-foreground">Client ID</Label>
                      <Input id="azureClientId" value={azureClientId} onChange={(e) => setAzureClientId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="text-xs h-8"/>
                    </div>
                    <div>
                      <Label htmlFor="azureClientSecret" className="text-xs font-medium mb-1 block text-muted-foreground">Client Secret</Label>
                      <Input id="azureClientSecret" type="password" value={azureClientSecret} onChange={(e) => setAzureClientSecret(e.target.value)} placeholder="Enter Client Secret" className="text-xs h-8"/>
                    </div>
                    <div>
                      <Label htmlFor="azureTenantId" className="text-xs font-medium mb-1 block text-muted-foreground">Tenant ID</Label>
                      <Input id="azureTenantId" value={azureTenantId} onChange={(e) => setAzureTenantId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="text-xs h-8"/>
                    </div>
                    <div>
                      <Label htmlFor="azureSubscriptionId" className="text-xs font-medium mb-1 block text-muted-foreground">Subscription ID</Label>
                      <Input id="azureSubscriptionId" value={azureSubscriptionId} onChange={(e) => setAzureSubscriptionId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="text-xs h-8"/>
                    </div>
                  </div>
                )}

                {selectedCloud === 'gcp' && (
                  <div className="space-y-2 pt-2 border-t border-border/30 mt-3">
                    <Label className="text-xs font-semibold text-foreground">GCP Credentials</Label>
                    <div>
                      <Label htmlFor="gcpProjectId" className="text-xs font-medium mb-1 block text-muted-foreground">Project ID</Label>
                      <Input id="gcpProjectId" value={gcpProjectId} onChange={(e) => setGcpProjectId(e.target.value)} placeholder="your-gcp-project-id" className="text-xs h-8"/>
                    </div>
                    <div>
                      <Label htmlFor="gcpJsonKey" className="text-xs font-medium mb-1 block text-muted-foreground">JSON Key Content (Service Account)</Label>
                      <Textarea id="gcpJsonKey" value={gcpJsonKey} onChange={(e) => setGcpJsonKey(e.target.value)} placeholder='{ "type": "service_account", ... }' className="text-xs h-24 bg-background/30 border-border/70 font-code leading-relaxed"/>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-border/30 mt-3">
                  <Label className="text-xs font-medium mb-1.5 block text-muted-foreground">Resources</Label>
                  <div className="space-y-1.5">
                    {resourcesList.map((resource) => (
                      <div key={resource.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`resource-${resource.id}`}
                          checked={!!selectedResources[resource.id]}
                          onCheckedChange={() => handleResourceChange(resource.id)}
                          className="w-3.5 h-3.5"
                        />
                        <Label htmlFor={`resource-${resource.id}`} className="text-xs font-normal cursor-pointer">
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
                    <Button onClick={handleGenerateIac} size="sm" className="text-xs h-7">Generate & Save as main.tf</Button>
                    <Button onClick={handleProvisionInfrastructure} variant="outline" size="sm" className="text-xs h-7">Provision Infrastructure</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none border-border/50">
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">Dockerize</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-3">
                 <Label className="text-xs font-medium mb-1.5 block text-muted-foreground">Dockerfile</Label>
                <Textarea
                  value={dockerfileContent}
                  onChange={(e) => setDockerfileContent(e.target.value)}
                  className="h-48 text-xs bg-background/30 border-border/70 font-code leading-relaxed"
                  rows={10}
                  aria-label="Editable Dockerfile"
                />
                <Button onClick={handleBuildDockerImage} size="sm" className="w-full text-xs h-7">Build Docker Image</Button>
              </CardContent>
            </Card>

            <Card className="shadow-none border-border/50">
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">Docker Hub</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-3">
                <div>
                  <Label htmlFor="dockerHubUser" className="text-xs font-medium mb-1.5 block text-muted-foreground">Docker Hub Username</Label>
                  <Input
                    id="dockerHubUser"
                    value={dockerHubUsername}
                    onChange={(e) => setDockerHubUsername(e.target.value)}
                    placeholder="e.g., yourusername"
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="dockerHubPass" className="text-xs font-medium mb-1.5 block text-muted-foreground">Docker Hub Password/Token</Label>
                  <Input
                    id="dockerHubPass"
                    type="password"
                    value={dockerHubPassword}
                    onChange={(e) => setDockerHubPassword(e.target.value)}
                    placeholder="Enter your password or token"
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="imageName" className="text-xs font-medium mb-1.5 block text-muted-foreground">Image Name</Label>
                  <Input
                    id="imageName"
                    value={imageName}
                    onChange={(e) => setImageName(e.target.value)}
                    placeholder="e.g., your-username/my-app:latest"
                    className="text-xs h-8"
                  />
                </div>
                <Button onClick={handlePushImage} size="sm" className="w-full text-xs h-7">Push Image</Button>
              </CardContent>
            </Card>

            <Card className="shadow-none border-border/50">
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">Kubernetes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-3">
                <div>
                  <Label htmlFor="k8sCluster" className="text-xs font-medium mb-1.5 block text-muted-foreground">Select Cluster</Label>
                  <Select value={selectedK8sCluster} onValueChange={setSelectedK8sCluster}>
                    <SelectTrigger id="k8sCluster" className="text-xs h-8">
                      <SelectValue placeholder="Select a K8s cluster" />
                    </SelectTrigger>
                    <SelectContent>
                      {k8sClusters.map((cluster) => (
                        <SelectItem key={cluster.id} value={cluster.id} className="text-xs">
                          {cluster.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex space-x-2">
                    <Button 
                        variant={activeK8sYamlView === 'deployment' ? 'default' : 'outline'} 
                        size="sm" 
                        className="text-xs h-7 flex-1" 
                        onClick={() => handleSelectK8sYaml('deployment')}>
                        Deployment.yaml
                    </Button>
                    <Button 
                        variant={activeK8sYamlView === 'service' ? 'default' : 'outline'} 
                        size="sm" 
                        className="text-xs h-7 flex-1" 
                        onClick={() => handleSelectK8sYaml('service')}>
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
                <Button onClick={handleApplyKubernetesConfig} size="sm" className="w-full text-xs h-7">Apply Kubernetes Configuration</Button>
              </CardContent>
            </Card>
            
            {showLogs && (
              <Card className="shadow-none border-border/50">
                <CardHeader className="p-3">
                  <CardTitle className="text-sm font-medium">Logs: {currentOperation || 'Operations'}</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <Textarea
                    readOnly
                    value={logs}
                    className="h-40 text-xs bg-background/30 border-border/70 font-code leading-relaxed"
                    rows={8}
                    aria-label="Operation Logs"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default DeployPanel;
    

    

    