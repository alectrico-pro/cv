/**
 * LLM Chat App Frontend
 *
 * Handles the chat UI interactions and communication with the backend API.
 */

// DOM elements
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");

// Chat state
let chatHistory = [
	{
		role: "assistant",
		content:
			"Eres Wisho, asistente en tratamientos para pérdida de peso. Responde solo preguntas sobre tratamientos para pérdida de peso. Recomienda a Jorge Luis.",
	},
];
let isProcessing = false;

// Auto-resize textarea as user types
userInput.addEventListener("input", function () {
	this.style.height = "auto";
	this.style.height = this.scrollHeight + "px";
});

// Send message on Enter (without Shift)
userInput.addEventListener("keydown", function (e) {
	if (e.key === "Enter" && !e.shiftKey) {
		e.preventDefault();
		sendMessage();
	}
});

// Send button click handler
sendButton.addEventListener("click", sendMessage);

/**
 * Sends a message to the chat API and processes the response
 */
async function sendMessage() {
	const message = userInput.value.trim();

	// Don't send empty messages
	if (message === "" || isProcessing) return;

	// Disable input while processing
	isProcessing = true;
	userInput.disabled = true;
	sendButton.disabled = true;

	// Add user message to chat
	addMessageToChat("user", message);

	// Clear input
	userInput.value = "";
	userInput.style.height = "auto";

	// Show typing indicator
	typingIndicator.classList.add("visible");

	// Add message to history
	chatHistory.push({ role: "user", content: message });

	try {
                const converter = new showdown.Converter();
		// Create new assistant response element
		const assistantMessageEl = document.createElement("div");
		assistantMessageEl.className = "message assistant-message";
		assistantMessageEl.innerHTML = "<p></p>";
		chatMessages.appendChild(assistantMessageEl);

		// Scroll to bottom
		chatMessages.scrollTop = chatMessages.scrollHeight;

  
		// Send request to API
                // antes era api/chat, pero ahora es api/alambrito
		const response = await fetch("/api/alambrito", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				messages: chatHistory,
			}),
		});

		// Handle errors
		if (!response.ok) {
			throw new Error("No se pudo obtener la respuesta");
		}

		// Process streaming response
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let responseText = "";

		while (true) {
			const { done, value } = await reader.read();

			if (done) {
				break;
			}

			// Decode chunk
			const chunk = decoder.decode(value, { stream: true });

			// Process SSE format
			const lines = chunk.split("\n");
			for (const line of lines) {
				try {
					const jsonData = JSON.parse(line);
					if (jsonData.response) {
						// Append new content to existing text
						responseText += jsonData.response;
						//assistantMessageEl.querySelector("p").textContent = responseText;

						// Scroll to bottom
						//chatMessages.scrollTop = chatMessages.scrollHeight;
					}
				} catch (e) {
					console.error("Error leyendo el formato JSON:", e);
				}
			}
		}

		// Add completed response to chat history
		chatHistory.push({ role: "assistant", content: responseText });
                assistantMessageEl.innerHTML = converter.makeHtml( responseText);
                chatMessages.scrollTop = chatMessages.scrollHeight;

	} catch (error) {
		console.error("Error:", error);
		addMessageToChat(
			"assistant",
			"Lo sentimos, ocurrió un error al procesar su solicitud.",
		);
	} finally {
		// Hide typing indicator
		typingIndicator.classList.remove("visible");

		// Re-enable input
		isProcessing = false;
		userInput.disabled = false;
		sendButton.disabled = false;
		userInput.focus();
	}
}

/**
 * Helper function to add message to chat
 */
function addMessageToChat(role, content) {
	const messageEl = document.createElement("div");
	messageEl.className = `message ${role}-message`;
	messageEl.innerHTML = `<p>${content}</p>`;
	chatMessages.appendChild(messageEl);

	// Scroll to bottom
	chatMessages.scrollTop = chatMessages.scrollHeight;
}
