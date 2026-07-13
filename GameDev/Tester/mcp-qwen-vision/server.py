"""
Qwen Vision MCP Server
将图片发送给通义千问视觉模型，返回文字描述给主智能体（DeepSeek）。
"""

import base64
import json
import mimetypes
import sys
from pathlib import Path

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent, ImageContent
from openai import OpenAI

# ====== 配置 ======
API_KEY = "sk-ws-H.IPLHEP.eWIv.MEUCIQDLPKHwYJ7bbnWzfbkB6qvO0MV-m4dn023brzXHROrHzgIgR469q9jhVDcgrhwYq9TG157AMAYr4fQtDPSo1VPw1KY"
BASE_URL = "https://ws-gyahwzgtjjc0xvbf.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1"
MODEL = "qwen-vl-max"

client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

# ====== MCP Server ======
app = Server("qwen-vision")


def encode_image(image_path: str) -> str:
    """读取图片并转为 base64 data URL"""
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"图片不存在: {image_path}")

    mime_type, _ = mimetypes.guess_type(str(path))
    if mime_type is None:
        mime_type = "image/png"  # fallback

    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")

    return f"data:{mime_type};base64,{data}"


def analyze(image_path: str, prompt: str = "请详细描述这张图片的内容，包括场景、物体、人物、文字、颜色、构图等所有你能看到的细节。") -> str:
    """将图片发送给 Qwen 视觉模型进行分析"""
    data_url = encode_image(image_path)

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
        max_tokens=4096,
    )

    return response.choices[0].message.content


@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="analyze_image",
            description=(
                "使用通义千问视觉模型分析图片内容。"
                "将图片路径传入，模型会返回图片的详细文字描述。"
                "适用于：图片内容识别、OCR文字提取、图表解析、场景理解等。"
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "image_path": {
                        "type": "string",
                        "description": "图片文件的绝对路径，如 C:\\Users\\xxx\\image.png",
                    },
                    "prompt": {
                        "type": "string",
                        "description": "可选：自定义分析提示词。不填则默认进行详细全面的图片描述。",
                    },
                },
                "required": ["image_path"],
            },
        )
    ]


@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name != "analyze_image":
        raise ValueError(f"Unknown tool: {name}")

    image_path = arguments["image_path"]
    prompt = arguments.get("prompt", None)

    try:
        if prompt:
            result = analyze(image_path, prompt)
        else:
            result = analyze(image_path)

        return [TextContent(type="text", text=result)]

    except FileNotFoundError as e:
        return [TextContent(type="text", text=f"❌ {e}")]
    except Exception as e:
        return [TextContent(type="text", text=f"❌ 识图失败: {str(e)}")]


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
