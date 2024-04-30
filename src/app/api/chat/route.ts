import fs, { Stats } from "fs";
import {
  LambdaClient,
  InvokeWithResponseStreamCommand,
  InvokeWithResponseStreamRequest,
  InvokeWithResponseStreamResponse,
  InvokeWithResponseStreamCommandOutput,
  InvokeWithResponseStreamResponseEvent,
} from "@aws-sdk/client-lambda";
import { NextResponse } from "next/server";
const client = new LambdaClient({
  region: "eu-north-1",
});

export async function POST(req: Request): Promise<NextResponse> {
  const { messages } = await req.json();
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

  return new NextResponse(response as ReadableStream<Uint8Array>, {
    status: 200,
  });
  /*
  if (stream) {
    for await (const chunk of stream) {
      return NextResponse.json(chunk);
    }
  }
  */
}
