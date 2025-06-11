
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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

const DeployPanel: React.FC<DeployPanelProps> = ({ isOpen }) => {
  const [selectedCloud, setSelectedCloud] = useState<string>('aws');
  const [selectedResources, setSelectedResources] = useState<Record<string, boolean>>({
    vm: true,
    loadBalancer: false,
    managedDb: false,
    storageBucket: false,
  });
  const [iacCode, setIacCode] = useState<string>('// Click "Generate & Save" to see IaC output.');
  const [logs, setLogs] = useState<string>('');
  const [showLogs, setShowLogs] = useState<boolean>(false);

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
    setShowLogs(false);
  };

  const handleProvisionInfrastructure = () => {
    setLogs(`Starting infrastructure provisioning for ${selectedCloud.toUpperCase()}...\n`);
    setShowLogs(true);
    // Simulate logging
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
  
  useEffect(() => {
    if (!isOpen) {
      setShowLogs(false); // Hide logs when panel is closed
    }
  }, [isOpen]);

  return (
    <div
      className={cn(
        "h-full bg-card shadow-md transition-all duration-300 ease-in-out overflow-hidden border-r border-border",
        isOpen ? "w-80 p-3" : "w-0 p-0"
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

                <div>
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
              </CardContent>
            </Card>

            <Card className="shadow-none border-border/50">
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">IaC Output <span className="text-xs text-muted-foreground">(Terraform / Pulumi)</span></CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <Textarea
                  readOnly
                  value={iacCode}
                  className="h-48 text-xs bg-background/30 border-border/70 font-code leading-relaxed"
                  rows={10}
                  aria-label="Infrastructure as Code Output"
                />
              </CardContent>
            </Card>
            
            <div className="flex flex-col space-y-2">
              <Button onClick={handleGenerateIac} size="sm">Generate & Save as main.tf</Button>
              <Button onClick={handleProvisionInfrastructure} variant="outline" size="sm">Provision Infrastructure</Button>
            </div>

            {showLogs && (
              <Card className="shadow-none border-border/50">
                <CardHeader className="p-3">
                  <CardTitle className="text-sm font-medium">Logs</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <Textarea
                    readOnly
                    value={logs}
                    className="h-40 text-xs bg-background/30 border-border/70 font-code leading-relaxed"
                    rows={8}
                    aria-label="Provisioning Logs"
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
