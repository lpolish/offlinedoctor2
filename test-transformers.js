/**
 * Simple test to verify Transformers.js integration
 */

import transformersService from './src/services/transformers.service';

async function testTransformersService() {
  console.log('🧪 Starting Transformers.js test...');
  
  try {
    // Test health check
    console.log('Testing health check...');
    const isHealthy = await transformersService.healthCheck();
    console.log(`Health check result: ${isHealthy}`);
    
    // Test model info
    console.log('Getting model info...');
    const modelInfo = transformersService.getModelInfo();
    console.log('Model info:', modelInfo);
    
    // Test medical response generation
    console.log('Testing medical response generation...');
    const response = await transformersService.generateMedicalResponse("Hello, how can you help me?");
    console.log('Response received:', {
      responseLength: response.response.length,
      model: response.metadata.model,
      duration: response.metadata.duration + 'ms',
      confidence: response.confidence
    });
    
    console.log('✅ All tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testTransformersService().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default testTransformersService;
