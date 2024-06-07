// Convenience functions for the renderer code

import { useLayoutEffect, useMemo, useRef } from "react";
import { Conversation, Message } from "./types";

export const unEscapeHTML = (unsafe: any) => {
  return unsafe
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&#039;", "'");
};

export const updateMessage = (
  updatedMessage: Message,
  currentConversationId: string,
  setConversationList: React.Dispatch<React.SetStateAction<Conversation[]>>
) => {
  setConversationList((prev: Conversation[]) =>
    prev.map((conversation: Conversation) => {
      if (conversation.id === currentConversationId) {
        // Find index of message to update
        const index = conversation.messages.findIndex(
          (message: Message) => message.id === updatedMessage.id
        );

        if (index !== -1) {
          // Update message in conversation
          const messages = [
            ...conversation.messages.slice(0, index),
            updatedMessage,
            ...conversation.messages.slice(index + 1),
          ];

          // Create new conversation object with updated message
          return {
            ...conversation,
            messages,
          };
        }
      }

      return conversation;
    })
  );
};

export const addMessage = (
  newMessage: Message,
  currentConversationId: string,
  setConversationList: React.Dispatch<React.SetStateAction<Conversation[]>>
) => {
  setConversationList((prev: Conversation[]) =>
    prev.map((conversation: Conversation) =>
      conversation.id === currentConversationId
        ? {
          ...conversation,
          // Add message to conversation; filter is here to prevent duplicate messages
          messages: [...conversation.messages, newMessage].filter(
            (message: Message, index: number, self: Message[]) =>
              index === self.findIndex((m: Message) => m.id === message.id)
          ),
        }
        : conversation
    )
  );
};


export const useDebounce =
  (callback: (...args: any[]) => void,
    delay: number) => {

    const callbackRef = useRef(callback);

    useLayoutEffect(() => {
      callbackRef.current = callback;
    });

    let timer: NodeJS.Timeout;

    const naiveDebounce = (
      func: (...args: any[]) => void,
      delayMs: number,
      ...args: any[]
    ) => {
      clearTimeout(timer);

      timer = setTimeout(() => {
        func(...args);
      }, delayMs);
    };

    return useMemo(() => (...args: any) =>
      naiveDebounce(callbackRef.current, delay,
        ...args), [delay]);
  };
