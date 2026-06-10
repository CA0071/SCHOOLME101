const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

async function test(name, fn) {
  try {
    console.log(`\n${colors.yellow}Testing: ${name}${colors.reset}`);
    await fn();
    console.log(`${colors.green}✓ Passed${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Failed: ${error.message}${colors.reset}`);
  }
}

async function runTests() {
  console.log(`${colors.blue}
╔════════════════════════════════════════════════════════╗
║        SCHOOLME101 MCP Server - Test Suite            ║
╚════════════════════════════════════════════════════════╝
  ${colors.reset}`);

  // Test 1: Health Check
  await test('Health Check', async () => {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.data.status !== 'running') {
      throw new Error('Server not running');
    }
  });

  // Test 2: Server Info
  await test('Server Info', async () => {
    const response = await axios.get(`${BASE_URL}/info`);
    if (!response.data.name) {
      throw new Error('Missing server name');
    }
  });

  // Test 3: Get Subjects
  await test('Get All Subjects', async () => {
    const response = await axios.get(`${BASE_URL}/api/subjects`);
    if (!Array.isArray(response.data.subjects) || response.data.subjects.length === 0) {
      throw new Error('No subjects found');
    }
    console.log(`   Found ${response.data.count} subjects`);
  });

  // Test 4: Get Subject Content
  await test('Get Subject Content (Mathematics)', async () => {
    const response = await axios.get(`${BASE_URL}/api/subject/Mathematics`);
    if (!response.data.content) {
      throw new Error('No content returned');
    }
    console.log(`   Content length: ${response.data.content.length} characters`);
  });

  // Test 5: Search Curriculum
  await test('Search Curriculum (query: algebra)', async () => {
    const response = await axios.get(`${BASE_URL}/api/search?q=algebra`);
    if (!Array.isArray(response.data.results)) {
      throw new Error('Invalid search response');
    }
    console.log(`   Found in ${response.data.resultsCount} subjects`);
  });

  // Test 6: AI Tutor Interface
  await test('AI Tutor Interface', async () => {
    const response = await axios.post(`${BASE_URL}/api/tutor`, {
      grade: '10',
      subject: 'Mathematics',
      question: 'How do I solve equations?'
    });
    if (!response.data.context) {
      throw new Error('No tutor context returned');
    }
    console.log(`   Tutor tone: ${response.data.instructions.tone}`);
  });

  // Test 7: Get Index
  await test('Get Curriculum Index', async () => {
    const response = await axios.get(`${BASE_URL}/api/index`);
    if (!response.data.index) {
      throw new Error('No index returned');
    }
    console.log(`   Index loaded successfully`);
  });

  // Test 8: Codex Integration (Mock)
  await test('Codex Integration Endpoint', async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/codex`, {
        apiKey: 'test-key',
        subject: 'Mathematics',
        query: 'What is calculus?',
        grade: '12'
      });
      if (!response.data.status) {
        throw new Error('No status returned');
      }
      console.log(`   Codex payload ready`);
    } catch (error) {
      // Codex might fail if no real API key, but endpoint should exist
      if (error.response && error.response.status !== 404) {
        console.log(`   Endpoint exists (expected validation)`);
      } else {
        throw error;
      }
    }
  });

  // Test 9: 404 Handling
  await test('404 Error Handling', async () => {
    try {
      await axios.get(`${BASE_URL}/api/nonexistent`);
      throw new Error('Should return 404');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(`   Properly returns 404`);
      } else {
        throw error;
      }
    }
  });

  // Test 10: Invalid Subject
  await test('Invalid Subject Handling', async () => {
    try {
      await axios.get(`${BASE_URL}/api/subject/NonexistentSubject12345`);
      throw new Error('Should return 404');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(`   Properly returns 404 for invalid subject`);
      } else {
        throw error;
      }
    }
  });

  console.log(`\n${colors.blue}
╔════════════════════════════════════════════════════════╗
║              Test Suite Complete                       ║
╚════════════════════════════════════════════════════════╝
  ${colors.reset}`);
}

// Run tests
runTests().catch(console.error);
