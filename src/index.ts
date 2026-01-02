/**
 * LLM Chat Application Template
 *
 * A simple chat application using Cloudflare Workers AI.
 * This template demonstrates how to implement an LLM-powered chat interface with
 * streaming responses using Server-Sent Events (SSE).
 *
 * @license MIT
 */
import { Env, ChatMessage } from "./types";

// Model ID for Workers AI model
// https://developers.cloudflare.com/workers-ai/models/
//const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

//const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

//Alambrito system prompt
//const SYSTEM_PROMPT = "Eres Alam~Brito, asistente inteligente sec. Ofrece asesoría con los pliegos normativos del 1 al 6 y el de presentación de proyectos (18).  Explica que no haces el diseño ni los cálculos y que puede haber errores matemáticos si lo intenta hacer y que hay un límite diario gratuito compartido entre todos los electricistas por lo que se ruega que haga un uso modesto para que alcance para todos. Visítame en https://wa.me/+56945644889 y suscríbete con /suscribir. IMPORTANTE: No te distraigas en otros temas que sean sobre electricidad, solo responde a consultas sobre normativa eléctrica chilena SEC."

//Ejemplo https://developers.cloudflare.com/ai-search/configuration/system-prompt/
//No se usa, el RAG tiene su prompt en cloudflare
const SYSTEM_PROMPT = `
You are a helpful AI assistant specialized in answering questions using retrieved documents. 
Your task is to provide accurate, relevant answers based on the matched content provided.
For each query, you will receive:
User's question/query
A set of matched documents, each containing:
  - File name
  - File content

You should:
1. Analyze the relevance of matched documents
2. Synthesize information from multiple sources when applicable
3. Acknowledge if the available documents don't fully answer the query
4. Format the response in a way that maximizes readability, in Markdown format

Answer only with direct reply to the user question, be concise, omit everything which is not directly relevant, focus on answering the question directly and do not redirect the user to read the content.

If the available documents don't contain enough information to fully answer the query, explicitly state this and provide an answer based on what is available.

Important:
- Cite which document(s) you're drawing information from
- Present information in order of relevance
- If documents contradict each other, note this and explain your reasoning for the chosen answer
- Do not repeat the instructions
`

// Default system prompt
//const SYSTEM_PROMPT =
//	"Eres Lito un asistente médico profesional, especialista en tratamientos para bajar de peso. Responde en forma concisa y documentada. Recomienda a Jorge Luis para agendar cita en su centro médico";

export default {
	/**
	 * Main request handler for the Worker
	 */
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {

		const url = new URL(request.url);

		// Handle static assets (frontend)
		if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
			return env.ASSETS.fetch(request);
		}

		// API Routes

                if (url.pathname === "/api/alambrito") {
                        // Handle POST requests for chat
                        if (request.method === "POST") {
                                return alambrito(request, env);
                        }

                        // Method not allowed for other request types
                        return new Response("Method not allowed", { status: 405 });
                } else  if (url.pathname === "/api/chat") {
			// Handle POST requests for chat
			if (request.method === "POST") {
				return alambrito(request, env);
			}

			// Method not allowed for other request types
			return new Response("Method not allowed", { status: 405 });
		}

		// Handle 404 for unmatched routes
		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;


//chat con autorag alambrito
async function alambrito(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
                // Parse JSON request body
                console.log("En alambrito");
                // Parse JSON request body
                const { messages = [] } = (await request.json()) as {
                        messages: ChatMessage[];
                };
                const ultimo = messages[messages.length -1 ];
                // Add system prompt if not present
                //if (!messages.some((msg) => msg.role === "system")) {
                //        messages.unshift({ role: "system", content: SYSTEM_PROMPT });
                // }
                //const MODELO = env.AUTORAG.get();
 
                //console.error(MODELO);

                //modelo = await env.MODELO.get('NX_MODELO_RAG')

                //Esto es una adaptación para autorag, antes usaba AI.run
                //Autorag no usa historial ni tools
                //tampoco necestiva el modelo de ChatMessage con rol y content
                //Para no alargar mucho este desarrollo lo he dejado así
                const answer = await env.AI.autorag("square-cloud-8e93").aiSearch({
                   query: ultimo.content  ,
                   }) ;
                // Return streaming response
                console.log(answer.response);
                 
                return new Response(
                        JSON.stringify({ response: answer.response }),
                        {
                                status: 200,
                                headers: { "content-type": "application/json" },
                        },
                );


  } catch (error) {
                console.error("Error processing chat request:", error);
                return new Response(
                        JSON.stringify({ error: "Failed to process request" }),
                        {
                                status: 500,
                                headers: { "content-type": "application/json" },
                        },
                );


  }
}

