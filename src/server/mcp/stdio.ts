import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { mcpServer } from './index.js'

async function run() {
  const transport = new StdioServerTransport()
  await mcpServer.connect(transport)
  console.error('RPB Dashboard MCP Server running on stdio')
}

run().catch((error) => {
  console.error('Fatal error running MCP server:', error)
  process.exit(1)
})
