import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Khởi tạo MCP Server với tên định danh và phiên bản
const server = new McpServer({
  name: "tixora-mcp",
  version: "1.0.0",
});

/**
 * Tool 1: get_tixora_info
 * Cung cấp thông tin tổng quan về nền tảng bán vé Tixora cho AI.
 */
server.tool(
  "get_tixora_info",
  "Lấy thông tin giới thiệu nền tảng Tixora, trạng thái hệ thống và các thành phố hỗ trợ",
  {},
  async () => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              platform: "Tixora Ticketing Platform",
              version: "1.0.0",
              status: "ONLINE",
              supported_cities: ["Hồ Chí Minh", "Hà Nội", "Đà Nẵng"],
              website: "https://tixora.vn",
              features: [
                "Event search & discovery",
                "Ticket pricing & tier inspection",
                "Real-time availability check",
                "Anti-oversell ticketing engine",
              ],
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

/**
 * Tool 2: echo_test
 * Công cụ test nhận tham số đầu vào và phản hồi lại (giúp kiểm tra schema Zod).
 */
server.tool(
  "echo_test",
  "Kiểm tra khả năng nhận tham số và phản hồi của Tixora MCP Server",
  {
    message: z.string().describe("Tin nhắn cần gửi thử nghiệm tới MCP Server"),
  },
  async ({ message }) => {
    return {
      content: [
        {
          type: "text",
          text: `[Tixora MCP Echo]: Bạn vừa gửi "${message}". Server đang hoạt động tốt!`,
        },
      ],
    };
  }
);

async function main() {
  // Giao thức Stdio: AI Host (Claude/Cursor) sẽ nói chuyện qua stdin và stdout của tiến trình này
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(">>> [Tixora MCP] Server running on stdio transport successfully.");
}

main().catch((err) => {
  console.error(">>> [Tixora MCP] Fatal error:", err);
  process.exit(1);
});
