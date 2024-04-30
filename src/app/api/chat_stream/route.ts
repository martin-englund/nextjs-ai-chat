import { streamingJsonResponse } from "@/app/shared/server/streaming";
import { NextRequest } from "next/server";
import {
  LambdaClient,
  InvokeWithResponseStreamCommand,
  InvokeWithResponseStreamRequest,
  InvokeWithResponseStreamResponse,
  InvokeWithResponseStreamCommandOutput,
  InvokeWithResponseStreamResponseEvent,
} from "@aws-sdk/client-lambda";
const client = new LambdaClient({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
/**
 * Exports a constant string specifying which Next.js runtime to use.
 * 'edge' runs on Vercel Edge Network.
 */
// export const runtime = 'edge';

/**
 * Exports a constant string specifying which Next.js runtime to use.
 * 'dynamic' forces all pages to be Server Components.
 */
export const dynamic = "force-dynamic";

const sleep = async (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

type Item = {
  key: string;
  value: string;
};

type chatMessage = {
  id: string;
  role: string;
  content: string;
};

type StreamChunk = {
  id: string;
  chunkValue: string;
};

const uint8ArrayToString = (uint8array: Uint8Array) => {
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(uint8array);
};

async function* fetchItems(): AsyncGenerator<Item, void, unknown> {
  for (let i = 0; i < 10; ++i) {
    await sleep(1000);
    yield {
      key: `key${i}`,
      value: `value${i}`,
    };
  }
}

async function* requestFlmStream(
  messages: chatMessage[]
): AsyncGenerator<StreamChunk, void, unknown> {
  const input: InvokeWithResponseStreamRequest = {
    FunctionName: "sp-cdk-bedrock-ai-streaming", // required
    InvocationType: "RequestResponse",
    LogType: "None",
    Payload: new Uint8Array(
      Buffer.from(
        JSON.stringify({
          queryParameters: {
            key: "a8sMxu77gkpBEOzzFs7cT3BlbkFJxMY5vIzQRbBpFYlzSwcs",
            messages: messages,
          },
        })
      )
    ), // e.g. Buffer.from("") or new TextEncoder().encode("")
  };
  const command = new InvokeWithResponseStreamCommand(input);
  const response: InvokeWithResponseStreamResponse = await client.send(command);
  const stream:
    | AsyncIterable<InvokeWithResponseStreamResponseEvent>
    | undefined = response?.EventStream;

  if (stream) {
    for await (const chunk of stream) {
      if (chunk?.PayloadChunk?.Payload) {
        yield {
          id: crypto.randomUUID(),
          chunkValue: uint8ArrayToString(chunk.PayloadChunk.Payload),
        };
      }
    }
  }
}

export async function GET(req: NextRequest) {
  return streamingJsonResponse(fetchItems());
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  console.log(messages);
  return streamingJsonResponse(requestFlmStream(messages));
}
