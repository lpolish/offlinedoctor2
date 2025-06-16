/**
 * Debug utilities for troubleshooting Ollama connection issues
 */

export async function debugOllamaConnection(): Promise<{
  status: string;
  details: string[];
  workingUrl?: string;
}> {
  const details: string[] = [];
  
  // Test URLs to try
  const urlsToTest = [
    'http://localhost:11434',
    'http://127.0.0.1:11434',
    'http://0.0.0.0:11434',
  ];
  
  for (const url of urlsToTest) {
    details.push(`Testing ${url}...`);
    
    try {
      // Test basic connectivity
      const versionResponse = await fetch(`${url}/api/version`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (versionResponse.ok) {
        const versionData = await versionResponse.json();
        details.push(`✅ ${url} - Version: ${versionData.version || 'Unknown'}`);
        
        // Test models endpoint
        const modelsResponse = await fetch(`${url}/api/tags`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        if (modelsResponse.ok) {
          const modelsData = await modelsResponse.json();
          const modelCount = Array.isArray(modelsData.models) ? modelsData.models.length : 0;
          details.push(`✅ ${url} - Models available: ${modelCount}`);
          
          if (modelCount > 0) {
            details.push(`   Models: ${modelsData.models.map((m: any) => m.name).join(', ')}`);
          }
          
          return {
            status: 'connected',
            details,
            workingUrl: url
          };
        } else {
          details.push(`⚠️ ${url} - Version OK but models endpoint failed (${modelsResponse.status})`);
        }
      } else {
        details.push(`❌ ${url} - HTTP ${versionResponse.status}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      details.push(`❌ ${url} - ${errorMsg}`);
    }
  }
  
  // Check for common issues
  details.push('');
  details.push('Troubleshooting suggestions:');
  details.push('1. Ensure Ollama is installed and running: ollama serve');
  details.push('2. Check if port 11434 is available: netstat -tlnp | grep 11434');
  details.push('3. Try manual test: curl http://localhost:11434/api/version');
  details.push('4. Check Ollama logs for errors');
  
  return {
    status: 'disconnected',
    details
  };
}

export async function testOllamaModel(baseUrl: string, model: string = 'tinyllama:latest'): Promise<{
  success: boolean;
  response?: string;
  error?: string;
  duration?: number;
}> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: 'Say hello',
        stream: false
      }),
      signal: AbortSignal.timeout(30000)
    });
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      response: data.response || 'No response content',
      duration
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    };
  }
}
