import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDistPath = path.resolve(__dirname, "../dist/index.js");

async function runTestClient() {
  console.log(">>> [Test Client] Khởi tạo MCP Client giả lập Claude Desktop...");

  // Tạo transport giả lập kết nối stdio với server
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverDistPath],
  });

  const client = new Client(
    { name: "mock-claude-host", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log(">>> [Test Client] Đã bắt tay (handshake) thành công với Tixora MCP Server!\n");

  // 1. Hỏi danh sách Tool mà MCP Server hỗ trợ
  console.log("--- BƯỚC 1: AI yêu cầu danh sách Tool (tools/list) ---");
  const toolsResult = await client.listTools();
  console.log("Các tools server cung cấp:", toolsResult.tools.map(t => `- ${t.name}: ${t.description}`).join("\n"));
  console.log("");

  // 2. Thử gọi Tool get_tixora_info
  console.log("--- BƯỚC 2: AI gọi Tool 'get_tixora_info' ---");
  const infoResult = await client.callTool({
    name: "get_tixora_info",
    arguments: {},
  });
  console.log("Dữ liệu MCP Server trả về:\n", (infoResult.content as any)[0]?.text);
  console.log("");

  // 3. Thử gọi Tool echo_test kèm tham số
  console.log("--- BƯỚC 3: AI gọi Tool 'echo_test' kèm tham số ---");
  const echoResult = await client.callTool({
    name: "echo_test",
    arguments: { message: "Xin chào Tixora từ Claude Desktop!" },
  });
  console.log("Dữ liệu MCP Server trả về:\n", (echoResult.content as any)[0]?.text);

  await client.close();
  console.log("\n>>> [Test Client] Hoàn tất kiểm thử MCP thành công 100%!");
}

runTestClient().catch(console.error);
