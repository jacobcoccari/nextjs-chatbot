'use client'; // This indicates that the component is a client-side component in a Next.js application.

import type {
  Attachment,
  ChatRequestOptions,
  CreateMessage,
  Message,
} from 'ai'; // Importing types for better type-checking and clarity.

import cx from 'classnames'; // Utility for conditionally joining class names.
import type React from 'react'; // Importing React types.
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react'; // React hooks and types for managing state and lifecycle.

import { toast } from 'sonner'; // A library for displaying toast notifications.
import { useLocalStorage, useWindowSize } from 'usehooks-ts'; // Custom hooks for local storage and window size.

import { sanitizeUIMessages } from '@/lib/utils'; // Utility function to sanitize messages.

import { ArrowUpIcon, PaperclipIcon, StopIcon } from './icons'; // Importing icons for UI components.
import { PreviewAttachment } from './preview-attachment'; // Component to preview attachments.
import { Button } from './ui/button'; // Button component.
import { Textarea } from './ui/textarea'; // Textarea component.
import { SuggestedActions } from './suggested-actions'; // Component for suggested actions.
import equal from 'fast-deep-equal'; // Utility for deep comparison of objects.

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  isLoading,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
}: {
  chatId: string;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<Message>;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions,
  ) => void;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Ref to access the textarea DOM element.
  const { width } = useWindowSize(); // Hook to get the current window size.

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight(); // Adjust the height of the textarea on component mount.
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height to auto to calculate scroll height.
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`; // Set height based on scroll height.
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height to auto.
      textareaRef.current.style.height = '98px'; // Set a default height.
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  ); // Hook to manage input state with local storage.

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      const finalValue = domValue || localStorageInput || ''; // Prefer DOM value over localStorage for hydration.
      setInput(finalValue);
      adjustHeight();
    }
  }, []); // Run once after hydration.

  useEffect(() => {
    setLocalStorageInput(input); // Update local storage whenever input changes.
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value); // Update input state on change.
    adjustHeight(); // Adjust textarea height.
  };

  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input element.
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]); // State to manage files being uploaded.

  const submitForm = useCallback(() => {
    window.history.replaceState({}, '', `/chat/${chatId}`); // Update browser history.

    handleSubmit(undefined, {
      experimental_attachments: attachments, // Pass attachments to handleSubmit.
    });

    setAttachments([]); // Clear attachments after submission.
    setLocalStorageInput(''); // Clear local storage input.
    resetHeight(); // Reset textarea height.

    if (width && width > 768) {
      textareaRef.current?.focus(); // Focus textarea if window width is greater than 768px.
    }
  }, [
    attachments,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
  ]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file); // Append file to form data.

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData, // Send form data to server.
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        }; // Return file details on successful upload.
      }
      const { error } = await response.json();
      toast.error(error); // Show error toast if upload fails.
    } catch (error) {
      toast.error('Failed to upload file, please try again!'); // Show error toast on exception.
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []); // Convert FileList to array.

      setUploadQueue(files.map((file) => file.name)); // Update upload queue with file names.

      try {
        const uploadPromises = files.map((file) => uploadFile(file)); // Create upload promises for each file.
        const uploadedAttachments = await Promise.all(uploadPromises); // Wait for all uploads to complete.
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]); // Update attachments with successfully uploaded files.
      } catch (error) {
        console.error('Error uploading files!', error); // Log error if upload fails.
      } finally {
        setUploadQueue([]); // Clear upload queue.
      }
    },
    [setAttachments],
  );

  return (
    <div className="relative w-full flex flex-col gap-4">
      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions append={append} chatId={chatId} /> // Show suggested actions if no messages, attachments, or uploads.
        )}

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex flex-row gap-2 overflow-x-scroll items-end">
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} /> // Preview each attachment.
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: '',
                name: filename,
                contentType: '',
              }}
              isUploading={true} // Indicate that the file is uploading.
            />
          ))}
        </div>
      )}

      <Textarea
        ref={textareaRef}
        placeholder="Send a message..."
        value={input}
        onChange={handleInput}
        className={cx(
          'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-muted pb-10 dark:border-zinc-700',
          className,
        )}
        rows={2}
        autoFocus
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();

            if (isLoading) {
              toast.error('Please wait for the model to finish its response!'); // Show error if model is still processing.
            } else {
              submitForm(); // Submit form on Enter key press.
            }
          }
        }}
      />

      <div className="absolute bottom-0 p-2 w-fit flex flex-row justify-start">
        <AttachmentsButton fileInputRef={fileInputRef} isLoading={isLoading} /> // Button to trigger file input.
      </div>

      <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
        {isLoading ? (
          <StopButton stop={stop} setMessages={setMessages} /> // Button to stop loading.
        ) : (
          <SendButton
            input={input}
            submitForm={submitForm}
            uploadQueue={uploadQueue} // Button to send message.
          />
        )}
      </div>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false; // Re-render if input changes.
    if (prevProps.isLoading !== nextProps.isLoading) return false; // Re-render if loading state changes.
    if (!equal(prevProps.attachments, nextProps.attachments)) return false; // Re-render if attachments change.

    return true; // Otherwise, do not re-render.
  },
);

function PureAttachmentsButton({
  fileInputRef,
  isLoading,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  isLoading: boolean;
}) {
  return (
    <Button
      className="rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click(); // Trigger file input click.
      }}
      disabled={isLoading} // Disable button if loading.
      variant="ghost"
    >
      <PaperclipIcon size={14} /> // Icon for attachments.
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
}) {
  return (
    <Button
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop(); // Stop the current process.
        setMessages((messages) => sanitizeUIMessages(messages)); // Sanitize messages.
      }}
    >
      <StopIcon size={14} /> // Icon for stopping.
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
}) {
  return (
    <Button
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        submitForm(); // Submit the form.
      }}
      disabled={input.length === 0 || uploadQueue.length > 0} // Disable if no input or files are uploading.
    >
      <ArrowUpIcon size={14} /> // Icon for sending.
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false; // Re-render if upload queue changes.
  if (prevProps.input !== nextProps.input) return false; // Re-render if input changes.
  return true; // Otherwise, do not re-render.
});