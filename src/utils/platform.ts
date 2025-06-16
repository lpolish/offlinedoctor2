/**
 * Platform-specific utilities for Ollama configuration
 */

export function getPlatformInfo() {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  return {
    isWindows: platform.includes('win') || userAgent.includes('windows'),
    isLinux: platform.includes('linux'),
    isMac: platform.includes('mac'),
    userAgent,
    platform
  };
}

export function getOllamaPlatformConfig() {
  const platformInfo = getPlatformInfo();
  
  // Base configuration
  const baseConfig = {
    baseUrl: 'http://localhost:11434',
    alternativeUrls: [
      'http://127.0.0.1:11434',
      'http://0.0.0.0:11434'
    ],
    timeout: 60000,
    healthCheckInterval: 30000
  };
  
  // Platform-specific adjustments
  if (platformInfo.isWindows) {
    return {
      ...baseConfig,
      // Windows often has issues with localhost resolution
      baseUrl: 'http://127.0.0.1:11434',
      alternativeUrls: [
        'http://localhost:11434',
        'http://0.0.0.0:11434',
        // Common Windows localhost alternatives
        'http://[::1]:11434',
        'http://local:11434'
      ],
      timeout: 90000, // Longer timeout for Windows
      healthCheckInterval: 45000
    };
  }
  
  if (platformInfo.isLinux) {
    return {
      ...baseConfig,
      // Linux usually works well with localhost
      alternativeUrls: [
        'http://127.0.0.1:11434',
        'http://0.0.0.0:11434',
        // Check systemd socket if running as service
        'http://unix:/run/ollama/ollama.sock',
      ]
    };
  }
  
  if (platformInfo.isMac) {
    return {
      ...baseConfig,
      // macOS specific alternatives
      alternativeUrls: [
        'http://127.0.0.1:11434',
        'http://0.0.0.0:11434',
        'http://localhost.local:11434'
      ]
    };
  }
  
  return baseConfig;
}

export function getOllamaInstallInstructions() {
  const platformInfo = getPlatformInfo();
  
  if (platformInfo.isWindows) {
    return {
      primary: 'Download Ollama for Windows from https://ollama.ai/download',
      steps: [
        '1. Download the Windows installer from ollama.ai',
        '2. Run the installer as Administrator',
        '3. Open Command Prompt and run: ollama serve',
        '4. In another window: ollama pull tinyllama:latest',
        '5. Restart this application'
      ],
      troubleshooting: [
        'If connection fails, try running as Administrator',
        'Check Windows Firewall settings for port 11434',
        'Ensure Ollama service is running in background'
      ]
    };
  }
  
  if (platformInfo.isLinux) {
    return {
      primary: 'Install via: curl -fsSL https://ollama.ai/install.sh | sh',
      steps: [
        '1. curl -fsSL https://ollama.ai/install.sh | sh',
        '2. ollama serve',
        '3. ollama pull tinyllama:latest',
        '4. Refresh this page'
      ],
      troubleshooting: [
        'Check if port 11434 is available: sudo netstat -tlnp | grep 11434',
        'Ensure ollama is in PATH: which ollama',
        'Check systemd service: systemctl status ollama'
      ]
    };
  }
  
  if (platformInfo.isMac) {
    return {
      primary: 'Install via Homebrew: brew install ollama',
      steps: [
        '1. brew install ollama',
        '2. ollama serve',
        '3. ollama pull tinyllama:latest',
        '4. Refresh this page'
      ],
      troubleshooting: [
        'Try manual download from ollama.ai if Homebrew fails',
        'Check Activity Monitor for ollama process',
        'Ensure Gatekeeper allows ollama to run'
      ]
    };
  }
  
  return {
    primary: 'Visit https://ollama.ai/download for installation instructions',
    steps: ['Visit ollama.ai for platform-specific instructions'],
    troubleshooting: ['Check ollama.ai documentation for your platform']
  };
}
