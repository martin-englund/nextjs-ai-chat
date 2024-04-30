"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { streamingFetch } from "../shared/client/streaming";
import { useRef, useEffect, useState } from "react";

interface chatMessage {
  id: string;
  role: string;
  content: string;
}

export function Chat() {
  //const { messages, input, handleInputChange, handleSubmit } = useChat();
  const chatParent = useRef<HTMLUListElement>(null);

  const convertToHtml = (text: string) => {
    text = text.replace("\\n", "<br />");
    text = text.replace("\n", "<br />");
    text = text.replace("*", "<li>");
    return text;
  };

  const [messages, setMessages] = useState<chatMessage[]>([
    /*
    {
      id: "321654987",
      role: "user",
      content: "Hello! Do you have a receipt for lemon mayonnaise?",
    },
    {
      id: "456789654",
      role: "bot",
      content: convertToHtml(
        "I do indeed have a delicious mayonnaise recipe that I'm happy to share! Here it is: Ingredients: * 1 egg yolk * 1 tablespoon of mustard (Dijon is a great choice) * of oil (canola or vegetable oil work well) * 1-2 tablespoons of white vinegar or lemon juice * Salt to taste Instructions: 1. In a medium bowl, whisk together the egg yolk and mustard. 2. Slowly drizzle in the oil while continuously whisking the mixture. This step because it helps the mayonnaise emulsify and prevents it from separating. 3. Once all the oil has been added, whisk in the vinegar or lemon juice. 4. Season the mayonnaise with salt to taste. 5. Store the mayonnaise in an airtight container in the refrigerator for up to one week. I hope you enjoy this recipe! Let me know if you have any questions or if you'd like any variations on the recipe."
      ),
    },
    */
  ]);
  const [msgId, setMsgId] = useState("");
  const [input, setInput] = useState("");

  useEffect(() => {
    const domNode = chatParent.current;
    if (domNode) {
      domNode.scrollTop = domNode.scrollHeight;
    }
  });

  useEffect(() => {
    setMessages((prev) => {
      let notFound = true;
      if (input.length > 0) {
        prev.map((element) => {
          if (element.id === msgId) {
            element.content = input;
            notFound = false;
          }
        });
        if (notFound) {
          prev.push({
            id: msgId,
            role: "user",
            content: input,
          });
        }
        return [...prev];
      } else {
        return [...prev.filter((element) => element.id !== msgId)];
      }
    });
  }, [input]);

  const generateUserMessageId = (id: string) => {
    setMsgId(id);
  };

  const resetUserMessageId = () => {
    setMsgId("");
  };

  const inputChangeHandler = (event: any) => {
    let id = msgId;
    if (msgId.length === 0) {
      id = crypto.randomUUID();
      generateUserMessageId(id);
    }
    setInput(event.target.value);
  };

  const submitRequest = (event: any) => {
    event.preventDefault();
    if (input.length > 0) {
      resetUserMessageId();
      setInput("");
    }
    handleApiRequest();
  };

  const handleApiRequest = async () => {
    const asyncFetch = async () => {
      const res = streamingFetch("/api/chat_stream", {
        method: "POST",
        cache: "no-store",
        body: JSON.stringify({ messages }),
      });
      const messageId = crypto.randomUUID();
      let messageContent: string = "";
      for await (let chunkValue of res) {
        try {
          const chunk = JSON.parse(chunkValue);
          messageContent += chunk.chunkValue;
          updateChatMessageContent(messageId, messageContent);
        } catch (e: any) {
          console.warn(e.message);
        }
      }
    };
    asyncFetch();
  };

  const updateChatMessageContent = (
    messageId: string,
    messageContent: string
  ) => {
    if (messageId) {
      const newMessage = {
        id: messageId,
        role: "bot",
        content: convertToHtml(messageContent),
      };

      setMessages((prev) => {
        let notFound = true;
        if (messageContent.length > 0) {
          prev.map((element) => {
            if (element.id === messageId) {
              element.content = messageContent;
              notFound = false;
            }
          });
          if (notFound) {
            prev.push({
              id: messageId,
              role: "bot",
              content: messageContent,
            });
          }
          return [...prev];
        } else {
          return [...prev.filter((element) => element.id !== messageId)];
        }
      });
    }
  };

  /*
    I do indeed have a delicious mayonnaise recipe that I'm happy to share! Here it is: Ingredients: * 1 egg yolk * 1 tablespoon of mustard (Dijon is a great choice) * of oil (canola or vegetable oil work well) * 1-2 tablespoons of white vinegar or lemon juice * Salt to taste Instructions: 1. In a medium bowl, whisk together the egg yolk and mustard. 2. Slowly drizzle in the oil while continuously whisking the mixture. This step because it helps the mayonnaise emulsify and prevents it from separating. 3. Once all the oil has been added, whisk in the vinegar or lemon juice. 4. Season the mayonnaise with salt to taste. 5. Store the mayonnaise in an airtight container in the refrigerator for up to one week. I hope you enjoy this recipe! Let me know if you have any questions or if you'd like any variations on the recipe.
  */

  return (
    <main className="flex flex-col w-full h-screen max-h-dvh bg-background">
      <header className="p-4 border-b w-full max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold">AI Chat</h1>
      </header>

      <section className="p-4">
        <form
          onSubmit={submitRequest}
          className="flex w-full max-w-3xl mx-auto items-center"
        >
          <Input
            className="flex-1 min-h-[40px]"
            placeholder="Type your question here..."
            type="text"
            value={input}
            onChange={inputChangeHandler}
          />
          <Button className="ml-2" type="submit">
            Submit
          </Button>
        </form>
      </section>

      <section className="container px-0 pb-10 flex flex-col flex-grow gap-4 mx-auto max-w-3xl">
        <ul
          ref={chatParent}
          className="h-1 p-4 flex-grow bg-muted/50 rounded-lg overflow-y-auto flex flex-col gap-4"
          key={crypto.randomUUID()}
        >
          {messages.map((m) => (
            <div key={m.id}>
              {m.role === "user" ? (
                <li
                  key={m.id ? m.id : crypto.randomUUID()}
                  className="flex flex-row"
                >
                  <div
                    className="rounded-xl p-4 bg-background shadow-md flex"
                    key={m.id}
                  >
                    <p className="text-primary" key={m.id}>
                      {m.content}
                    </p>
                  </div>
                </li>
              ) : (
                m.role.length > 0 && (
                  <li
                    key={m.id ? m.id : crypto.randomUUID()}
                    className="flex flex-row-reverse"
                  >
                    <div
                      className="rounded-xl p-4 bg-background shadow-md flex w-3/4"
                      key={m.id}
                    >
                      <p className="text-primary" key={m.id}>
                        <span className="font-bold" key={m.id}>
                          Mistral:{" "}
                        </span>
                        {m.content}
                      </p>
                    </div>
                  </li>
                )
              )}
            </div>
          ))}
        </ul>
      </section>
    </main>
  );
}
